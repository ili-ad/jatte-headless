from __future__ import annotations

import logging
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

    name = "smalltalk.greet"
    description = "Offer a brief, friendly greeting and ask how to help."
    input_schema = {"name": {"type": "string", "optional": True}}
    output_schema = {"text": "string"}

    def can_handle(self, text: str, ctx: ConversationCtx) -> bool:  # noqa: D401 - simple predicate
        _ = ctx
        lowered = text.lower()
        return any(token in lowered for token in ("hello", "hi", "hey"))

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
