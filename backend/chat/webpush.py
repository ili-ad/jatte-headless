"""Utilities for web push subscription fan-out."""

from __future__ import annotations

from typing import Any, Optional, Tuple

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Room


def _resolve_room_from_client_id(client_id: Any) -> Optional[Tuple[str, Room]]:
    """Return the room associated with ``client_id`` if it resembles a cid."""

    if not isinstance(client_id, str):
        return None

    candidate = client_id.strip()
    if not candidate:
        return None

    potential_uuid: Optional[str]
    if ":" in candidate:
        _prefix, suffix = candidate.split(":", 1)
        potential_uuid = suffix or None
    else:
        potential_uuid = candidate

    if not potential_uuid:
        return None

    room = Room.objects.filter(uuid=potential_uuid).first()
    if not room:
        return None

    canonical_cid = candidate if ":" in candidate else f"messaging:{room.uuid}"
    return canonical_cid, room


def broadcast_subscriptions_registered(
    user: Any,
    client_id: Any,
    response_payload: dict[str, Any],
) -> None:
    """Emit a WS event notifying peers of a registered push subscription."""

    resolved = _resolve_room_from_client_id(client_id)
    if not resolved:
        return

    cid_value, room = resolved

    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return

        payload: dict[str, Any] = {
            "type": "push.subscription.registered",
            "cid": cid_value,
            "subscriptions": response_payload.get("subscriptions", []),
        }

        if "client_id" in response_payload:
            payload["client_id"] = response_payload.get("client_id")

        if "platform" in response_payload:
            payload["platform"] = response_payload.get("platform")

        username = getattr(user, "username", None)
        if username:
            payload["user"] = username

        async_to_sync(channel_layer.group_send)(
            f"channel_{room.uuid}",
            {"type": "chat.message", "payload": payload},
        )
    except Exception:
        # Fan-out failures should not prevent the HTTP response.
        pass
