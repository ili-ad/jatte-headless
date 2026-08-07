"""Small channel-layer broadcast helper shared by chat add-ons."""

from __future__ import annotations

import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .utils import canonical_cid, group_name_for_cid


logger = logging.getLogger(__name__)


def _broadcast_to_cid(cid: str, payload: dict) -> None:
    """Send ``payload`` only to subscribers of the canonical room group."""

    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        canonical = canonical_cid(cid)
        event_payload = dict(payload)
        event_payload.setdefault("cid", canonical)
        async_to_sync(channel_layer.group_send)(
            group_name_for_cid(canonical),
            {"type": "chat.message", "payload": event_payload},
        )
    except Exception:  # pragma: no cover - delivery must not break HTTP writes
        logger.exception("chat.broadcast.failed", extra={"cid": cid})
