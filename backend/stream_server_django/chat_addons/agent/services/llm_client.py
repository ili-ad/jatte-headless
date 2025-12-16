"""LLM client abstraction for chat agent invocations.

Ensures agent LLM calls are forcibly bounded in wall-clock time by
wrapping provider calls in a short-lived thread with ``future.result``
timeouts. This prevents request handlers from hanging indefinitely when
the upstream SDK fails to respect its own timeout configuration.
"""

from __future__ import annotations

import logging
import os
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from dataclasses import dataclass, field
from datetime import timedelta
from decimal import Decimal
import json
from typing import Any, Callable, Iterable, Protocol

from django.core.cache import caches
from django.utils import timezone
from django.conf import settings

from openai import OpenAI, APITimeoutError

from ..config import (
    AGENT_DAILY_BUDGET_USD,
    AGENT_MAX_TOKENS,
    AGENT_MODEL,
    AGENT_STREAMING_TIMEOUT_SEC,
    AGENT_TIMEOUT_SEC,
    AGENT_TOOL_MESSAGE_SANITIZER_MODE,
)
from .tooling import ToolCall

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Message sanitization
# ---------------------------------------------------------------------------


def _normalize_mode(mode: str | None) -> str:
    normalized = str(mode or "drop").strip().lower()
    if normalized not in {"drop", "system", "off"}:
        return "drop"
    return normalized


def _summarize_tool_message(message: dict[str, Any]) -> str:
    tool_call_id = message.get("tool_call_id")
    content = message.get("content")
    content_text = str(content) if content is not None else ""
    truncated = content_text[:200]
    prefix = "(tool result dropped"
    if isinstance(tool_call_id, str) and tool_call_id:
        prefix += f"; orphan tool_call_id={tool_call_id}"
    prefix += ")"
    if truncated:
        return f"{prefix} {truncated}"
    return prefix


def sanitize_messages_for_openai(
    messages: list[dict[str, Any]], mode: str
) -> tuple[list[dict[str, Any]], dict[str, int | str]]:
    """Defensively sanitize tool messages before hitting OpenAI.

    Returns the sanitized list along with a stats mapping for logging.
    """

    normalized_mode = _normalize_mode(mode)
    sanitized: list[dict[str, Any]] = []
    active_tool_call_ids: set[str] = set()
    tool_phase_active = False

    dropped = 0
    converted = 0

    for message in messages:
        if not isinstance(message, dict):
            active_tool_call_ids = set()
            tool_phase_active = False
            sanitized.append(message)
            continue

        role = str(message.get("role", "")).lower()

        if role == "assistant" and isinstance(message.get("tool_calls"), list):
            raw_tool_calls = message["tool_calls"]
            active_tool_call_ids = {
                tc.get("id")
                for tc in raw_tool_calls
                if isinstance(tc, dict)
                and isinstance(tc.get("id"), str)
                and tc.get("id")
            }
            tool_phase_active = True
            sanitized.append(message)
            continue

        if role == "tool":
            tool_call_id = message.get("tool_call_id")
            valid = (
                tool_phase_active
                and isinstance(tool_call_id, str)
                and bool(tool_call_id)
                and tool_call_id in active_tool_call_ids
            )
            if valid or normalized_mode == "off":
                sanitized.append(message)
            elif normalized_mode == "system":
                sanitized.append({"role": "system", "content": _summarize_tool_message(message)})
                converted += 1
            else:
                dropped += 1
            continue

        tool_phase_active = False
        active_tool_call_ids = set()
        sanitized.append(message)

    stats: dict[str, int | str] = {
        "dropped": dropped,
        "converted": converted,
        "total_in": len(messages),
        "total_out": len(sanitized),
        "mode": normalized_mode,
    }

    return sanitized, stats


def _log_sanitizer_stats(stats: dict[str, int | str], *, context: dict[str, Any] | None = None) -> None:
    if not stats["dropped"] and not stats["converted"]:
        return

    context_fields = {"cid", "trace_id", "job_id"}
    extra = {
        "dropped_tool_messages": stats["dropped"],
        "converted_tool_messages": stats["converted"],
        "total_messages_in": stats["total_in"],
        "total_messages_out": stats["total_out"],
        "sanitizer_mode": stats["mode"],
    }
    if context:
        extra.update({k: v for k, v in context.items() if k in context_fields})

    logger.warning("agent.llm.messages_sanitized", extra=extra)


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
    tool_calls: list[ToolCall] = field(default_factory=list)
    reason: str = "ok"


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

    def run_streaming(
        self,
        *,
        messages: Iterable[dict[str, Any]],
        tools: list[dict[str, Any]] | None,
        model: str,
        max_tokens: int,
        timeout: float | None = None,
        on_update: Callable[[str], None] | None = None,
    ) -> LLMResult | dict[str, Any]:  # pragma: no cover - protocol definition
        """Execute a streaming call and surface partial text via the callback."""


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
        default_streaming_timeout: int | None = None,
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
        self.default_streaming_timeout = (
            default_streaming_timeout or AGENT_STREAMING_TIMEOUT_SEC
        )
        self.default_max_tokens = default_max_tokens or AGENT_MAX_TOKENS
        self.cost_guard = cost_guard or DailyCostGuard()
        self.sanitizer_mode = AGENT_TOOL_MESSAGE_SANITIZER_MODE

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
        tool_calls: list[ToolCall] = []
        messages = payload.get("messages")
        if isinstance(messages, list):
            for message in messages:
                if not isinstance(message, dict):
                    continue
                raw_tool_calls = message.get("tool_calls")
                if not isinstance(raw_tool_calls, list):
                    continue
                for entry in raw_tool_calls:
                    if not isinstance(entry, dict):
                        continue
                    function = entry.get("function") or {}
                    if not isinstance(function, dict):
                        continue
                    name = function.get("name")
                    if not isinstance(name, str) or not name:
                        continue
                    raw_arguments = function.get("arguments", "")
                    arguments: dict[str, Any]
                    if isinstance(raw_arguments, str):
                        try:
                            parsed_args = json.loads(raw_arguments)
                        except ValueError:
                            arguments = {"input": raw_arguments}
                        else:
                            if isinstance(parsed_args, dict):
                                arguments = parsed_args
                            else:
                                arguments = {"input": parsed_args}
                    elif isinstance(raw_arguments, dict):
                        arguments = raw_arguments
                    else:
                        arguments = {"input": str(raw_arguments)} if raw_arguments is not None else {}

                    call_id = entry.get("id")
                    if not isinstance(call_id, str) or not call_id:
                        call_id = f"call_{uuid.uuid4().hex}"

                    tool_calls.append(ToolCall(name=name, arguments=arguments, id=call_id))
        return LLMResult(
            content=content,
            tokens_used=tokens_used,
            model=model,
            latency_ms=latency_ms,
            cost_usd=cost,
            tool_calls=tool_calls,
        )

    def _estimate_cost(self, tokens: int) -> Decimal:
        if tokens <= 0:
            tokens = self.default_max_tokens
        return (Decimal(tokens) * self.TOKEN_RATE_USD).quantize(
            Decimal("0.000001")
        )

    def _execute_with_timeout(
        self, func: Callable[[], Any], *, timeout: float | None
    ) -> Any:
        """Execute ``func`` with a hard timeout.

        The provider is still given the requested ``timeout`` value, but we
        also enforce the limit here so that a misbehaving SDK cannot hang the
        request thread.
        """

        if timeout is None:
            return func()

        executor = ThreadPoolExecutor(max_workers=1)
        try:
            future = executor.submit(func)
            try:
                return future.result(timeout=timeout)
            except FuturesTimeoutError as exc:
                future.cancel()
                raise TimeoutError("LLM provider timed out") from exc
        finally:
            executor.shutdown(wait=False, cancel_futures=True)

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

        message_list = list(messages)
        sanitized_messages, sanitizer_stats = sanitize_messages_for_openai(
            message_list, self.sanitizer_mode
        )
        _log_sanitizer_stats(sanitizer_stats)

        start = time.perf_counter()
        try:
            payload = self._execute_with_timeout(
                lambda: self.provider.run(
                    messages=sanitized_messages,
                    tools=tools,
                    model=call_model,
                    max_tokens=call_max_tokens,
                    timeout=float(call_timeout),
                ),
                timeout=float(call_timeout),
            )
        except (APITimeoutError, TimeoutError) as exc:
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

    def run_streaming(
        self,
        messages: Iterable[dict[str, Any]],
        *,
        tools: list[dict[str, Any]] | None = None,
        model: str | None = None,
        max_tokens: int | None = None,
        timeout: int | None = None,
        cost_guard: CostGuard | None = None,
        on_update: Callable[[str], None] | None = None,
        context: dict[str, Any] | None = None,
    ) -> LLMResult:
        call_model = model or self.default_model
        call_max_tokens = min(
            max_tokens or self.default_max_tokens, self.default_max_tokens
        )
        call_timeout = timeout if timeout is not None else self.default_streaming_timeout
        guard = cost_guard or self.cost_guard

        projected_cost = self._estimate_cost(call_max_tokens)
        guard.ensure_within_budget(projected_cost)

        message_list = list(messages)
        sanitized_messages, sanitizer_stats = sanitize_messages_for_openai(
            message_list, self.sanitizer_mode
        )
        _log_sanitizer_stats(sanitizer_stats, context=context)

        log_context = {"model": call_model, "timeout": call_timeout}
        if context:
            log_context.update(
                {k: v for k, v in context.items() if k in {"cid", "trace_id", "job_id"}}
            )

        logger.info("agent.llm.streaming.run_start", extra=log_context)

        start = time.perf_counter()
        first_chunk = {"seen": False}

        def _wrapped_on_update(buffer: str) -> None:
            elapsed = time.perf_counter() - start
            if call_timeout is not None and elapsed > float(call_timeout):
                raise TimeoutError("LLM provider timed out (streaming budget exceeded)")

            if not first_chunk["seen"]:
                first_chunk["seen"] = True
                logger.info(
                    "agent.llm.streaming.first_chunk",
                    extra={
                        "model": call_model,
                        "timeout": call_timeout,
                        "elapsed_ms": int(elapsed * 1000),
                        **(
                            {
                                k: v
                                for k, v in (context or {}).items()
                                if k in {"cid", "trace_id", "job_id"}
                            }
                        ),
                    },
                )

            if on_update:
                on_update(buffer)

        try:
            if tools:
                payload = self._execute_with_timeout(
                    lambda: self.provider.run(
                        messages=sanitized_messages,
                        tools=tools,
                        model=call_model,
                        max_tokens=call_max_tokens,
                        timeout=float(call_timeout) if call_timeout is not None else None,
                    ),
                    timeout=float(call_timeout) if call_timeout is not None else None,
                )
                elapsed = time.perf_counter() - start
            else:
                payload = self._execute_with_timeout(
                    lambda: self.provider.run_streaming(
                        messages=sanitized_messages,
                        tools=tools,
                        model=call_model,
                        max_tokens=call_max_tokens,
                        timeout=None,
                        on_update=_wrapped_on_update,
                    ),
                    timeout=float(call_timeout) if call_timeout is not None else None,
                )
                elapsed = time.perf_counter() - start
        except (APITimeoutError, TimeoutError) as exc:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            timeout_extra = {"model": call_model, "timeout": call_timeout, "latency_ms": elapsed_ms}
            timeout_extra.update({k: v for k, v in (context or {}).items() if k in {"cid", "trace_id", "job_id"}})
            logger.warning(
                "agent.llm.streaming_timeout",
                extra=timeout_extra,
            )
            raise TimeoutError("LLM provider timed out") from exc
        finally:
            latency_ms = int((time.perf_counter() - start) * 1000)

        result = self._coerce_result(payload, model=call_model, latency_ms=latency_ms)
        if tools and on_update and result.content:
            on_update(result.content)
        guard.record_cost(result.cost_usd)
        logger.info(
            "agent.llm.success.streaming",
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
        self.text = text or "Let me connect you with a teammate."

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

    def run_streaming(
        self,
        *,
        messages: Iterable[dict[str, Any]],
        tools: list[dict[str, Any]] | None,
        model: str,
        max_tokens: int,
        timeout: float | None = None,
        on_update: Callable[[str], None] | None = None,
    ) -> dict[str, Any]:
        _ = (messages, tools, model, max_tokens, timeout)
        if on_update:
            on_update(self.text)
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

    def run_streaming(
        self,
        *,
        messages: Iterable[dict[str, Any]],
        tools: list[dict[str, Any]] | None,
        model: str,
        max_tokens: int,
        timeout: float | None = None,
        on_update: Callable[[str], None] | None = None,
    ) -> dict[str, Any]:
        client = self._get_client()
        message_list = list(messages)

        call_model = model or self.default_model
        call_max_tokens = max_tokens or self.default_max_tokens

        logger.info(
            "OpenAIProvider.run_streaming model=%s max_tokens=%s num_messages=%s",
            call_model,
            call_max_tokens,
            len(message_list),
        )

        kwargs: dict[str, Any] = {
            "model": call_model,
            "messages": message_list,
            "stream": True,
        }
        if tools:
            kwargs["tools"] = tools

        if call_model.startswith("gpt-5"):
            kwargs["max_completion_tokens"] = call_max_tokens
            kwargs["reasoning_effort"] = "minimal"
        else:
            kwargs["max_tokens"] = call_max_tokens
            kwargs["temperature"] = self.temperature

        if timeout is not None:
            client = client.with_options(timeout=timeout)

        buffer = ""
        tokens_used = 0

        stream = client.chat.completions.create(**kwargs)
        logger.info(
            "OpenAIProvider.run_streaming.stream_open",
            extra={
                "model": call_model,
                "max_tokens": call_max_tokens,
                "num_messages": len(message_list),
            },
        )

        saw_first_chunk = False
        for event in stream:
            delta = event.choices[0].delta
            delta_text = getattr(delta, "content", None) or ""
            if delta_text:
                buffer += delta_text
                if on_update:
                    on_update(buffer)
                if not saw_first_chunk:
                    logger.info(
                        "OpenAIProvider.run_streaming.first_chunk",
                        extra={
                            "model": call_model,
                            "length": len(delta_text),
                            "buffer_length": len(buffer),
                        },
                    )
                    saw_first_chunk = True

            if getattr(event, "usage", None) is not None:
                tokens_used = event.usage.total_tokens or tokens_used

        if not saw_first_chunk:
            logger.warning(
                "OpenAIProvider.run_streaming.no_chunks",
                extra={
                    "model": call_model,
                    "max_tokens": call_max_tokens,
                    "num_messages": len(message_list),
                },
            )

        return {"content": buffer, "tokens_used": tokens_used, "model": call_model}
