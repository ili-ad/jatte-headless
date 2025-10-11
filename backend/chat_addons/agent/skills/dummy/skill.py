from __future__ import annotations

from datetime import datetime
from typing import Any

from ..base import Skill
from ..context import ConversationCtx


class DummyEchoSkill(Skill):
    name = "dummy.echo"
    description = "Echo back provided arguments for integration testing."
    input_schema = {"type": "object", "properties": {"message": {"type": "string"}}}
    output_schema = {"type": "object", "properties": {"echoed": {"type": "string"}}}
    enabled_by_default = False

    def can_handle(self, text: str, ctx: ConversationCtx) -> bool:
        _ = ctx
        return "echo" in text.lower()

    def execute(self, args: dict[str, Any], ctx: ConversationCtx) -> dict[str, Any]:
        message = args.get("message") or ""
        timestamp = ctx.get("now")
        if isinstance(timestamp, datetime):
            suffix = timestamp.isoformat()
        else:  # pragma: no cover - defensive
            suffix = ""
        return {"echoed": f"{message}:{suffix}".rstrip(":")}
