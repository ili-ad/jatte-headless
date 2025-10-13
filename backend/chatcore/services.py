from __future__ import annotations

from datetime import datetime
from typing import Literal

from django.utils import timezone

from chat_addons.admin_console.services import gating

GateDecision = Literal["allow", "hold", "reject"]


def should_gate_first_message(*, cid: str, user_id: str, text: str, now: datetime) -> GateDecision:
    """Return whether the first message should be allowed, held, or rejected."""

    moment = now
    if moment.tzinfo is None:
        moment = timezone.make_aware(moment, timezone=timezone.utc)
    return gating.decide_first_message(cid=cid, user_id=user_id, text=text or "", now=moment)
