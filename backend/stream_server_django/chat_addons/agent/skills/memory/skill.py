from __future__ import annotations

from typing import Any

from ..base import Skill
from ..context import ConversationCtx
from ...services.memory import MemoryService

_MEMORY_SERVICE = MemoryService()


class RememberSkill(Skill):
    """Store a fact in the per-room scratchpad."""

    name = "memory_remember"
    description = "Store a short fact in the agent memory for this room."
    input_schema = {
        "type": "object",
        "properties": {"text": {"type": "string"}},
        "required": ["text"],
        "additionalProperties": False,
    }
    output_schema = {
        "type": "object",
        "properties": {"ok": {"type": "boolean"}},
        "required": ["ok"],
        "additionalProperties": False,
    }
    enabled_by_default = False

    def can_handle(self, text: str, ctx: ConversationCtx) -> bool:  # noqa: D401 - simple predicate
        _ = ctx
        lowered = text.lower()
        return lowered.startswith("remember ") or "note to self" in lowered

    def execute(self, args: dict[str, Any], ctx: ConversationCtx) -> dict[str, Any]:
        cid = ctx.get("cid") if isinstance(ctx, dict) else None
        if not cid:
            raise ValueError("Conversation context missing cid")
        payload = args or {}
        text = payload.get("text")
        if not isinstance(text, str) or not text.strip():
            raise ValueError("text is required")
        _MEMORY_SERVICE.add_line(cid=cid, role="agent", text=text.strip())
        return {"ok": True}


class RecallSkill(Skill):
    """Fetch recent facts from the scratchpad matching a query."""

    name = "memory_recall"
    description = "Recall previously saved facts relevant to a query."
    input_schema = {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "k": {"type": "integer"},
        },
        "required": ["query"],
        "additionalProperties": False,
    }
    output_schema = {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "text": {"type": "string"},
                        "created_at": {"type": "string"},
                        "role": {"type": "string"},
                    },
                    "required": ["text", "role", "created_at"],
                    "additionalProperties": False,
                },
            }
        },
        "required": ["items"],
        "additionalProperties": False,
    }
    enabled_by_default = False

    def can_handle(self, text: str, ctx: ConversationCtx) -> bool:  # noqa: D401 - simple predicate
        _ = ctx
        lowered = text.lower()
        return any(
            phrase in lowered
            for phrase in ("what did i say", "what do you remember", "recall")
        )

    def execute(self, args: dict[str, Any], ctx: ConversationCtx) -> dict[str, Any]:
        cid = ctx.get("cid") if isinstance(ctx, dict) else None
        if not cid:
            raise ValueError("Conversation context missing cid")
        payload = args or {}
        query = payload.get("query", "")
        k_value = payload.get("k")
        if k_value is None:
            items = _MEMORY_SERVICE.recall(cid=cid, query=query)
        else:
            try:
                k_int = int(k_value)
            except (TypeError, ValueError) as exc:
                raise ValueError("k must be an integer") from exc
            items = _MEMORY_SERVICE.recall(cid=cid, query=query, k=k_int)
        return {"items": items}
