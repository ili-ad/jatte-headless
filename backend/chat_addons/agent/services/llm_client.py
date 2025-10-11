"""LLM client abstraction for chat agent invocations."""
from __future__ import annotations

import logging
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal
from typing import Any, Iterable, Protocol

from django.core.cache import caches
from django.utils import timezone

from ..config import (
    AGENT_DAILY_BUDGET_USD,
    AGENT_MAX_TOKENS,
    AGENT_MODEL,
    AGENT_TIMEOUT_SEC,
)

logger = logging.getLogger(__name__)


@dataclass
class LLMResult:
    """Normalized result from an LLM provider."""

    content: str
    tokens_used: int
    model: str
    latency_ms: int
    cost_usd: Decimal


class LLMProvider(Protocol):
    """Protocol describing the minimal provider surface."""

    def run(
        self,
        *,
        messages: Iterable[dict[str, Any]],
        tools: list[dict[str, Any]] | None,
        model: str,
        max_tokens: int,
    ) -> LLMResult | dict[str, Any]:  # pragma: no cover - protocol definition
        """Execute the call and return either an :class:`LLMResult` or mapping."""


class BudgetExceeded(Exception):
    """Raised when a budget guard rejects the request."""


class CostGuard:
    """Interface for enforcing runtime budgets."""

    def ensure_within_budget(self, projected_cost: Decimal) -> None:  # pragma: no cover - interface method
        raise NotImplementedError

    def record_cost(self, cost: Decimal) -> None:  # pragma: no cover - interface method
        raise NotImplementedError


class DailyCostGuard(CostGuard):
    """Track daily spend within Django's default cache."""

    cache_key: str = "chat_agent:daily_spend_usd"

    def __init__(
        self,
        *,
        budget: Decimal | None = None,
        cache_alias: str = "default",
    ) -> None:
        self.budget = Decimal(budget or AGENT_DAILY_BUDGET_USD)
        self.cache = caches[cache_alias]

    def _today_key(self) -> str:
        today = timezone.now().date().isoformat()
        return f"{self.cache_key}:{today}"

    def _ttl_until_tomorrow(self) -> int:
        now = timezone.now()
        tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        delta = tomorrow - now
        return max(int(delta.total_seconds()), 1)

    def _get_spend(self) -> Decimal:
        raw = self.cache.get(self._today_key())
        if raw is None:
            return Decimal("0")
        try:
            return Decimal(str(raw))
        except Exception:  # pragma: no cover - defensive fallback
            return Decimal("0")

    def ensure_within_budget(self, projected_cost: Decimal) -> None:
        spend = self._get_spend()
        if spend + projected_cost > self.budget:
            raise BudgetExceeded(
                f"Agent budget exceeded: {spend + projected_cost} > {self.budget}"
            )

    def record_cost(self, cost: Decimal) -> None:
        spend = self._get_spend() + Decimal(cost)
        self.cache.set(self._today_key(), str(spend), timeout=self._ttl_until_tomorrow())


class LLMClient:
    """Execute LLM calls with guardrails for latency and spend."""

    TOKEN_RATE_USD = Decimal("0.000005")

    def __init__(
        self,
        *,
        provider: LLMProvider | None = None,
        default_model: str | None = None,
        default_timeout: int | None = None,
        default_max_tokens: int | None = None,
        cost_guard: CostGuard | None = None,
    ) -> None:
        self.provider = provider or CannedProvider()
        self.default_model = default_model or AGENT_MODEL
        self.default_timeout = default_timeout or AGENT_TIMEOUT_SEC
        self.default_max_tokens = default_max_tokens or AGENT_MAX_TOKENS
        self.cost_guard = cost_guard or DailyCostGuard()

    def _coerce_result(
        self,
        payload: LLMResult | dict[str, Any],
        *,
        model: str,
        latency_ms: int,
    ) -> LLMResult:
        if isinstance(payload, LLMResult):
            return payload

        content = str(payload.get("content", ""))
        tokens_used = int(payload.get("tokens_used", 0))
        raw_cost = payload.get("cost_usd")
        cost = Decimal(str(raw_cost)) if raw_cost is not None else self._estimate_cost(tokens_used)
        return LLMResult(
            content=content,
            tokens_used=tokens_used,
            model=model,
            latency_ms=latency_ms,
            cost_usd=cost,
        )

    def _estimate_cost(self, tokens: int) -> Decimal:
        if tokens <= 0:
            tokens = self.default_max_tokens
        return (Decimal(tokens) * self.TOKEN_RATE_USD).quantize(Decimal("0.000001"))

    def run(
        self,
        messages: Iterable[dict[str, Any]],
        *,
        tools: list[dict[str, Any]] | None = None,
        model: str | None = None,
        max_tokens: int | None = None,
        timeout: int | None = None,
        cost_guard: CostGuard | None = None,
    ) -> LLMResult:
        call_model = model or self.default_model
        call_max_tokens = min(max_tokens or self.default_max_tokens, self.default_max_tokens)
        call_timeout = min(timeout or self.default_timeout, self.default_timeout)
        guard = cost_guard or self.cost_guard

        projected_cost = self._estimate_cost(call_max_tokens)
        guard.ensure_within_budget(projected_cost)

        start = time.perf_counter()
        try:
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(
                    self.provider.run,
                    messages=messages,
                    tools=tools,
                    model=call_model,
                    max_tokens=call_max_tokens,
                )
                payload = future.result(timeout=call_timeout)
        except FuturesTimeout as exc:
            logger.warning("agent.llm.timeout", extra={"model": call_model, "timeout": call_timeout})
            raise TimeoutError("LLM provider timed out") from exc
        finally:
            latency_ms = int((time.perf_counter() - start) * 1000)

        result = self._coerce_result(payload, model=call_model, latency_ms=latency_ms)
        guard.record_cost(result.cost_usd)
        logger.info(
            "agent.llm.success",
            extra={
                "model": call_model,
                "latency_ms": result.latency_ms,
                "tokens_used": result.tokens_used,
                "cost_usd": float(result.cost_usd),
            },
        )
        return result


class CannedProvider:
    """Simple provider that returns a canned response."""

    def __init__(self, *, text: str | None = None) -> None:
        self.text = text or "Thanks — an agent will follow up shortly."

    def run(
        self,
        *,
        messages: Iterable[dict[str, Any]],
        tools: list[dict[str, Any]] | None,
        model: str,
        max_tokens: int,
    ) -> dict[str, Any]:
        _ = (messages, tools, model, max_tokens)
        return {
            "content": self.text,
            "tokens_used": min(32, max_tokens),
            "cost_usd": Decimal("0.000160"),
        }
