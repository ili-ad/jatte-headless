"""LLM client abstraction for chat agent invocations.

This version removes the internal ThreadPool-based timeout and instead
relies on the OpenAI Python client's own timeout handling, so that
AGENT_TIMEOUT_SEC behaves as the *real* wall-clock limit for calls.
"""

from __future__ import annotations

import logging
import os
import time
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal
from typing import Any, Iterable, Protocol

from django.core.cache import caches
from django.utils import timezone
from django.conf import settings

from openai import OpenAI, APITimeoutError

from ..config import (
    AGENT_DAILY_BUDGET_USD,
    AGENT_MAX_TOKENS,
    AGENT_MODEL,
    AGENT_TIMEOUT_SEC,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public result type
# ---------------------------------------------------------------------------


@dataclass
class LLMResult:
    """Normalized result from an LLM provider."""

    content: str
    tokens_used: int
    model: str
    latency_ms: int
    cost_usd: Decimal


# ---------------------------------------------------------------------------
# Provider protocol + budget guard
# ---------------------------------------------------------------------------


class LLMProvider(Protocol):
    """Protocol describing the minimal provider surface used by :class:`LLMClient`."""

    def run(
        self,
        *,
        messages: Iterable[dict[str, Any]],
        tools: list[dict[str, Any]] | None,
        model: str,
        max_tokens: int,
        timeout: float | None = None,
    ) -> LLMResult | dict[str, Any]:  # pragma: no cover - protocol definition
        """Execute the call and return either an :class:`LLMResult` or a plain mapping."""


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
        tomorrow = (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
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
        self.cache.set(
            self._today_key(),
            str(spend),
            timeout=self._ttl_until_tomorrow(),
        )


# ---------------------------------------------------------------------------
# Main LLM client wrapper
# ---------------------------------------------------------------------------


class LLMClient:
    """Execute LLM calls with guardrails for latency and spend."""

    # Very conservative flat token rate, purely for budgeting purposes.
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
        if provider is not None:
            # Explicitly injected provider (used by tests/overrides).
            self.provider = provider
        else:
            # Choose provider based on settings / environment.
            provider_key = getattr(
                settings,
                "AGENT_LLM_PROVIDER",
                os.getenv("AGENT_LLM_PROVIDER", "canned"),
            )
            provider_key = str(provider_key).lower()

            if provider_key == "openai":
                self.provider = OpenAIProvider()
            elif provider_key in ("canned", "", None):
                self.provider = CannedProvider()
            else:
                raise RuntimeError(
                    f"Unknown AGENT_LLM_PROVIDER {provider_key!r}; "
                    "expected 'canned' or 'openai'."
                )

        self.default_model = default_model or AGENT_MODEL
        self.default_timeout = default_timeout or AGENT_TIMEOUT_SEC
        self.default_max_tokens = default_max_tokens or AGENT_MAX_TOKENS
        self.cost_guard = cost_guard or DailyCostGuard()

    # ---- internal helpers -------------------------------------------------

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
        cost = (
            Decimal(str(raw_cost))
            if raw_cost is not None
            else self._estimate_cost(tokens_used)
        )
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
        return (Decimal(tokens) * self.TOKEN_RATE_USD).quantize(
            Decimal("0.000001")
        )

    # ---- public entrypoint ------------------------------------------------

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
        call_max_tokens = min(
            max_tokens or self.default_max_tokens, self.default_max_tokens
        )
        call_timeout = min(timeout or self.default_timeout, self.default_timeout)
        guard = cost_guard or self.cost_guard

        projected_cost = self._estimate_cost(call_max_tokens)
        guard.ensure_within_budget(projected_cost)

        start = time.perf_counter()
        try:
            payload = self.provider.run(
                messages=list(messages),
                tools=tools,
                model=call_model,
                max_tokens=call_max_tokens,
                timeout=float(call_timeout),
            )
        except APITimeoutError as exc:
            # Let the orchestration layer know this was a timeout, so it can
            # surface the handoff text ("Let me connect you with a teammate.")
            logger.warning(
                "agent.llm.timeout",
                extra={"model": call_model, "timeout": call_timeout},
            )
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


# ---------------------------------------------------------------------------
# Simple canned provider (for tests / dev)
# ---------------------------------------------------------------------------


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
        timeout: float | None = None,
    ) -> dict[str, Any]:
        _ = (messages, tools, model, max_tokens, timeout)
        return {
            "content": self.text,
            "tokens_used": min(32, max_tokens),
            "cost_usd": Decimal("0.000160"),
        }


# ---------------------------------------------------------------------------
# OpenAI-backed provider
# ---------------------------------------------------------------------------


@dataclass
class OpenAIProvider(LLMProvider):
    """OpenAI-backed provider that plugs into :class:`LLMClient`.

    It handles both:

    * classic chat models (gpt-4o, gpt-4o-mini, etc.) which use ``max_tokens``
    * GPT‑5 family (``gpt-5``, ``gpt-5-mini`` and their dated aliases) which use
      ``max_completion_tokens`` and optional ``reasoning_effort``.

    The goal is to mirror *exactly* what works in your REPL proof‑of‑concept,
    where you call::

        client.chat.completions.create(
            model="gpt-5-mini",
            messages=[...],
            max_completion_tokens=128,
            reasoning_effort="minimal",
        )
    """

    # Defaults; stay in sync with your agent config by default.
    api_key: str | None = None
    base_url: str | None = None
    default_model: str = AGENT_MODEL
    default_max_tokens: int = AGENT_MAX_TOKENS
    temperature: float = 0.2

    _client: OpenAI | None = None

    # ---- internal helpers -------------------------------------------------

    def _resolve_api_key(self) -> str:
        key = (
            self.api_key
            or getattr(settings, "OPENAI_API_KEY", None)
            or os.getenv("OPENAI_API_KEY")
        )
        if not key:
            raise RuntimeError(
                "OPENAI_API_KEY must be set (in Django settings or environment) "
                "to use OpenAIProvider"
            )
        return key

    def _resolve_base_url(self) -> str | None:
        return (
            self.base_url
            or getattr(settings, "OPENAI_API_BASE_URL", None)
            or os.getenv("OPENAI_API_BASE_URL")
        )

    def _get_client(self) -> OpenAI:
        if self._client is None:
            # Disable retries here so that AGENT_TIMEOUT_SEC behaves as the
            # actual wall-clock limit instead of per-attempt.
            self._client = OpenAI(
                api_key=self._resolve_api_key(),
                base_url=self._resolve_base_url(),
                max_retries=0,
            )
        return self._client

    # ---- main entrypoint used by LLMClient --------------------------------

    def run(
        self,
        *,
        messages: Iterable[dict[str, Any]],
        tools: list[dict[str, Any]] | None,
        model: str,
        max_tokens: int,
        timeout: float | None = None,
    ) -> dict[str, Any]:
        """Call ``chat.completions.create`` for either classic or GPT‑5 models."""
        client = self._get_client()
        message_list = list(messages)

        call_model = model or self.default_model
        call_max_tokens = max_tokens or self.default_max_tokens

        logger.info(
            "OpenAIProvider.run model=%s max_tokens=%s num_messages=%s",
            call_model,
            call_max_tokens,
            len(message_list),
        )

        # Base kwargs shared by all chat models.
        kwargs: dict[str, Any] = {
            "model": call_model,
            "messages": message_list,
        }
        if tools:
            kwargs["tools"] = tools

        # GPT‑5 family:
        #   * uses max_completion_tokens (NOT max_tokens)
        #   * we *always* set reasoning_effort="minimal" to avoid the
        #     "all tokens went to hidden reasoning, no surface text" failure
        #     mode you saw in the REPL.
        #
        # Classic chat models:
        #   * use max_tokens + temperature.
        if call_model.startswith("gpt-5"):
            kwargs["max_completion_tokens"] = call_max_tokens
            kwargs["reasoning_effort"] = "minimal"
            # We intentionally do NOT pass temperature for GPT‑5.
        else:
            kwargs["max_tokens"] = call_max_tokens
            kwargs["temperature"] = self.temperature

        # Use per-request timeout if provided; otherwise the client's default
        # (10 minutes) will apply.
        if timeout is not None:
            client = client.with_options(timeout=timeout)

        # Actual OpenAI call; APITimeoutError is propagated up to LLMClient.
        resp = client.chat.completions.create(**kwargs)

        choice = resp.choices[0].message
        content = choice.content or ""

        # Convert response into the payload shape LLMClient expects.
        messages_out: list[dict[str, Any]] = []

        # If the model emitted tool calls, preserve them for the agent tooling layer.
        tool_calls = getattr(choice, "tool_calls", None)
        if tool_calls:
            messages_out.append(
                {
                    "role": "assistant",
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": tc.type,
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                        for tc in tool_calls
                    ],
                }
            )

        if content:
            messages_out.append({"role": "assistant", "content": content})

        tokens_used = 0
        if getattr(resp, "usage", None) is not None:
            # For GPT‑5, this is prompt + reasoning + output tokens.
            tokens_used = resp.usage.total_tokens or 0

        return {
            "content": content,
            "messages": messages_out,
            "tokens_used": tokens_used,
            "model": resp.model,
            # No explicit "cost_usd" here — LLMClient._estimate_cost will fill it in
            # using TOKEN_RATE_USD if nothing else is provided.
        }
