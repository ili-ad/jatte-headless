"""Agent service orchestration for automated chat replies."""
from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from ..config import AGENT_MAX_TOKENS, AGENT_MODEL, AGENT_TIMEOUT_SEC
from .llm_client import BudgetExceeded, LLMClient, LLMResult

logger = logging.getLogger(__name__)


@dataclass
class AgentReply:
    """Normalized agent reply payload."""

    text: str
    tokens_used: int
    latency_ms: int
    model: str
    cost_usd: Decimal
    reason: str = "success"

    def __str__(self) -> str:  # pragma: no cover - convenience
        return self.text


class AgentService:
    """Service responsible for producing agent replies."""

    canned_text = "Thanks — an agent will follow up shortly."

    def __init__(self, *, llm_client: LLMClient | None = None) -> None:
        self.llm_client = llm_client or LLMClient()

    def _compose_messages(
        self,
        user_text: str,
        *,
        meta: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        messages: list[dict[str, Any]] = []
        history = (meta or {}).get("history")
        if isinstance(history, list):
            for message in history:
                if isinstance(message, dict) and {"role", "content"}.issubset(message):
                    messages.append(
                        {"role": message["role"], "content": str(message["content"])}
                    )
        messages.append({"role": "user", "content": user_text})
        return messages

    def generate(
        self,
        cid: str,
        user_id: str | None = None,
        text: str | None = None,
        *,
        prompt: str | None = None,
        meta: dict[str, Any] | None = None,
        request_id: str | None = None,
    ) -> AgentReply:
        """Return a canned reply (LLM integration stub)."""

        message_text = text if text is not None else (prompt or "")
        messages = self._compose_messages(message_text, meta=meta)
        effective_request_id = request_id or (meta or {}).get("request_id") or str(uuid.uuid4())

        result: LLMResult | None = None
        reason = "success"

        try:
            result = self.llm_client.run(
                messages,
                model=AGENT_MODEL,
                max_tokens=AGENT_MAX_TOKENS,
                timeout=AGENT_TIMEOUT_SEC,
            )
        except BudgetExceeded:
            reason = "budget_exceeded"
        except TimeoutError:
            reason = "timeout"
        except Exception:  # pragma: no cover - defensive log
            reason = "error"
            logger.exception("agent.generate.failure")

        if result is None:
            reply_text = self.canned_text
            tokens_used = 0
            latency_ms = 0
            model = AGENT_MODEL
            cost = Decimal("0")
        else:
            reply_text = result.content or self.canned_text
            tokens_used = result.tokens_used
            latency_ms = result.latency_ms
            model = result.model
            cost = result.cost_usd

        reply = AgentReply(
            text=reply_text,
            tokens_used=tokens_used,
            latency_ms=latency_ms,
            model=model,
            cost_usd=cost,
            reason=reason,
        )

        logger.info(
            "agent.generate",
            extra={
                "request_id": effective_request_id,
                "cid": cid,
                "user_id": user_id,
                "latency_ms": reply.latency_ms,
                "tokens_used": reply.tokens_used,
                "reason": reply.reason,
                "cost_usd": float(reply.cost_usd),
            },
        )

        return reply


_service_override: AgentService | None = None
_default_service: AgentService | None = None


def get_agent_service() -> AgentService:
    """Return the configured agent service instance."""

    if _service_override is not None:
        return _service_override

    global _default_service
    if _default_service is None:
        _default_service = AgentService()
    return _default_service


def set_agent_service(service: AgentService | None) -> None:
    """Override the global service instance (primarily for tests)."""

    global _service_override
    _service_override = service
