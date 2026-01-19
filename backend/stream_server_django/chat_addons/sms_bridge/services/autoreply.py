from __future__ import annotations

import logging
from dataclasses import dataclass

from django.conf import settings

from .consent import is_opted_out
from ..tasks import sms_autoreply_task

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SmsAutoreplyDecision:
    should_send: bool
    reason: str


def maybe_enqueue_sms_autoreply(
    *, cid: str, sender_e164: str | None, text: str
) -> SmsAutoreplyDecision:
    if sender_e164 and is_opted_out(sender_e164):
        logger.info(
            "sms.autoreply.skipped",
            extra={"reason": "opted_out", "cid": cid, "sender_e164": sender_e164},
        )
        return SmsAutoreplyDecision(False, "opted_out")

    enabled = getattr(settings, "SMS_AUTOREPLY_ENABLED", False)
    if not enabled:
        return SmsAutoreplyDecision(False, "disabled")

    allowlist = set(getattr(settings, "SMS_AUTOREPLY_ALLOWLIST", []) or [])
    if sender_e164 and allowlist and sender_e164 not in allowlist:
        logger.info(
            "sms.autoreply.skipped",
            extra={"reason": "not_allowlisted", "cid": cid, "sender_e164": sender_e164},
        )
        return SmsAutoreplyDecision(False, "not_allowlisted")

    if not text.strip():
        return SmsAutoreplyDecision(False, "empty")

    sms_autoreply_task.delay(cid=cid, sender_e164=sender_e164, text=text)
    return SmsAutoreplyDecision(True, "enqueued")


__all__ = ["SmsAutoreplyDecision", "maybe_enqueue_sms_autoreply"]
