from __future__ import annotations

import re
from typing import Literal

from django.utils import timezone

from ..models import SmsConsent

STOP_WORDS = {"stop", "stopall", "unsubscribe", "cancel", "end", "quit"}
START_WORDS = {"start", "unstop"}

CONTROL_RE = re.compile(r"[^\w\s]+$")


def _normalize_text(text: str) -> str:
    stripped = " ".join(text.strip().split())
    cleaned = CONTROL_RE.sub("", stripped)
    return cleaned.lower()


def parse_control_word(text: str) -> Literal["stop", "start"] | None:
    normalized = _normalize_text(text)
    compact = normalized.replace(" ", "")
    if normalized in STOP_WORDS or compact in STOP_WORDS:
        return "stop"
    if normalized in START_WORDS or compact in START_WORDS:
        return "start"
    return None


def is_opted_out(phone_e164: str) -> bool:
    record = SmsConsent.objects.filter(phone_e164=phone_e164).first()
    if not record or not record.opted_out_at:
        return False
    if record.opted_in_at is None:
        return True
    return record.opted_out_at > record.opted_in_at


def mark_opt_out(phone_e164: str) -> None:
    now = timezone.now()
    SmsConsent.objects.update_or_create(
        phone_e164=phone_e164,
        defaults={"opted_out_at": now},
    )


def mark_opt_in(phone_e164: str) -> None:
    now = timezone.now()
    SmsConsent.objects.update_or_create(
        phone_e164=phone_e164,
        defaults={"opted_in_at": now},
    )


def stop_confirmation_text() -> str:
    return "You’re opted out. Reply START to resume."


def start_confirmation_text() -> str:
    return "You’re opted back in."


__all__ = [
    "START_WORDS",
    "STOP_WORDS",
    "is_opted_out",
    "mark_opt_in",
    "mark_opt_out",
    "parse_control_word",
    "start_confirmation_text",
    "stop_confirmation_text",
]
