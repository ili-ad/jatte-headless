from __future__ import annotations

import logging
import re
import time
from datetime import datetime, timezone
from typing import Any

from ..base import Skill
from ..context import ConversationCtx
from ...services import safe_calc

logger = logging.getLogger(__name__)
_ALLOWED_CHARS = re.compile(r"^[0-9\s()+\-*/.]+$")


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


class UtilityTimeNowSkill(Skill):
    """Return the current UTC time."""

    name = "utility.time_now"
    description = "Return the current time (UTC) in ISO 8601 and epoch."
    input_schema: dict[str, Any] = {}
    output_schema = {"iso_utc": "string", "epoch_secs": "number"}

    def can_handle(self, text: str, ctx: ConversationCtx) -> bool:  # noqa: D401 - simple predicate
        _ = ctx
        lowered = text.lower()
        return "time" in lowered

    def execute(self, args: dict[str, Any], ctx: ConversationCtx) -> dict[str, Any]:
        start = time.perf_counter()
        ok = False
        try:
            now = datetime.now(timezone.utc)
            payload = {"iso_utc": now.isoformat(), "epoch_secs": float(now.timestamp())}
            ok = True
            return payload
        finally:
            _log_execution(ctx, self.name, ok, start)


class UtilityCalcSkill(Skill):
    """Safely evaluate arithmetic expressions."""

    name = "utility.calc"
    description = "Safely evaluate a simple arithmetic expression (+,-,*,/, parentheses)."
    input_schema = {"expr": {"type": "string"}}
    output_schema = {"result": "number"}

    def can_handle(self, text: str, ctx: ConversationCtx) -> bool:  # noqa: D401 - simple predicate
        _ = ctx
        has_digit = any(ch.isdigit() for ch in text)
        has_operator = any(op in text for op in "+-*/")
        return has_digit and has_operator

    def execute(self, args: dict[str, Any], ctx: ConversationCtx) -> dict[str, Any]:
        start = time.perf_counter()
        ok = False
        try:
            expr = args.get("expr") if isinstance(args, dict) else None
            if not isinstance(expr, str):
                return {"error": {"message": "invalid expression"}}

            candidate = expr.strip()
            if not candidate or len(candidate) > 64:
                return {"error": {"message": "invalid expression"}}
            if not _ALLOWED_CHARS.fullmatch(candidate):
                return {"error": {"message": "invalid expression"}}

            try:
                value = safe_calc.evaluate(candidate)
            except (safe_calc.UnsafeExpressionError, ZeroDivisionError, ValueError):
                return {"error": {"message": "invalid expression"}}

            result_value: float | int
            if float(value).is_integer():
                result_value = int(value)
            else:
                result_value = float(value)

            ok = True
            return {"result": result_value}
        finally:
            _log_execution(ctx, self.name, ok, start)
