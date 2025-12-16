from __future__ import annotations

import logging
import re
import time
from typing import Any

from ..base import Skill
from ..context import ConversationCtx

logger = logging.getLogger(__name__)


def _log_execution(ctx: ConversationCtx, skill_name: str, ok: bool, start: float) -> None:
    metadata = ctx.get("metadata", {}) if isinstance(ctx, dict) else {}
    request_id = metadata.get("request_id") if isinstance(metadata, dict) else None
    latency_ms = int((time.perf_counter() - start) * 1000)
    logger.info(
        "skill.execute",
        extra={
            "request_id": request_id,
            "cid": ctx.get("cid"),
            "skill": skill_name,
            "ok": ok,
            "latency_ms": latency_ms,
        },
    )


class SmalltalkGreetSkill(Skill):
    """Offer a short, friendly greeting."""

    name = "smalltalk_greet"
    description = "Offer a brief, friendly greeting and ask how to help."
    input_schema = {
        "type": "object",
        "properties": {"name": {"type": "string"}},
        "additionalProperties": False,
    }
    output_schema = {
        "type": "object",
        "properties": {"text": {"type": "string"}},
        "required": ["text"],
        "additionalProperties": False,
    }

    def can_handle(self, text: str, ctx: ConversationCtx) -> bool:  # noqa: D401 - simple predicate
        _ = ctx
        normalized = " ".join(text.strip().lower().split())
        pure_greetings = {"hi", "hello", "hey", "bonjour", "salut"}
        help_only = {"help"}
        max_len = 32

        if normalized in pure_greetings or normalized in help_only:
            return True

        starts_with_greeting = re.match(r"^(hi|hello|hey|bonjour|salut)\b", normalized)
        if starts_with_greeting and len(normalized) <= max_len:
            return True

        return False

    def execute(self, args: dict[str, Any], ctx: ConversationCtx) -> dict[str, Any]:
        start = time.perf_counter()
        ok = False
        try:
            name = args.get("name") if isinstance(args, dict) else None
            if isinstance(name, str):
                trimmed = name.strip()
            else:
                trimmed = ""

            if trimmed:
                text = f"Hello, {trimmed}! How can I help today?"
            else:
                text = "Hello! How can I help today?"

            result = {"text": text}
            ok = True
            return result
        finally:
            _log_execution(ctx, self.name, ok, start)
