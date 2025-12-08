from __future__ import annotations

import base64
import binascii
import json
from dataclasses import dataclass
from datetime import datetime
from typing import Sequence

from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import OuterRef, Subquery
from django.db.models.functions import Coalesce
from django.utils import timezone

from stream_server_django.chat.models import Message, Room

from ..models import RoomOwnership

User = get_user_model()

_DEFAULT_LIMIT = 25
_MAX_LIMIT = 50


@dataclass
class QueueEntry:
    cid: str
    name: str | None
    last_message_at: datetime | None
    last_text: str | None
    owner_id: str | None
    unread_count: int
    activity_at: datetime
    room_uuid: str


@dataclass
class QueueResult:
    results: Sequence[QueueEntry]
    next_cursor: str | None


def list_queue(*, user: User, status: str, limit: int | None, cursor: str | None) -> QueueResult:
    """Return queue rows matching the requested status."""

    limit_value = _coerce_limit(limit)
    cursor_state = _parse_cursor(cursor)

    queryset = _base_queryset()

    if status == "mine":
        queryset = queryset.filter(ownership_owner_pk=user.pk)
    elif status == "new":
        queryset = queryset.filter(ownership_owner_pk__isnull=True)
    else:  # pragma: no cover - guarded by view validation
        raise ValueError("Unknown status")

    if cursor_state is not None:
        activity, room_uuid = cursor_state
        queryset = queryset.filter(
            models.Q(activity_at__lt=activity)
            | (models.Q(activity_at=activity) & models.Q(uuid__lt=room_uuid))
        )

    rows = list(queryset[: limit_value + 1])
    has_more = len(rows) > limit_value
    trimmed_rows = rows[:limit_value]

    entries = [_map_row_to_entry(row) for row in trimmed_rows]

    next_cursor = None
    if has_more and trimmed_rows:
        last_row = trimmed_rows[-1]
        next_cursor = _encode_cursor(last_row.activity_at, last_row.uuid)

    return QueueResult(results=entries, next_cursor=next_cursor)


def claim_room(*, user: User, room: Room) -> RoomOwnership:
    """Assign ``room`` to ``user`` if not already owned by someone else."""

    ownership, _created = RoomOwnership.objects.select_for_update().get_or_create(
        room=room
    )
    if ownership.owner and ownership.owner != user:
        raise PermissionError("Room already claimed")

    ownership.owner = user
    ownership.claimed_at = timezone.now()
    ownership.save(update_fields=["owner", "claimed_at"])
    return ownership


def _map_row_to_entry(row: Room) -> QueueEntry:
    owner_identifier = row.ownership_owner_supabase_uid or (
        str(row.ownership_owner_pk) if row.ownership_owner_pk else None
    )
    return QueueEntry(
        cid=f"messaging:{row.uuid}",
        name=_extract_name(row),
        last_message_at=row.last_message_at,
        last_text=row.last_text,
        owner_id=owner_identifier,
        unread_count=0,
        activity_at=row.activity_at,
        room_uuid=row.uuid,
    )


def _extract_name(room: Room) -> str | None:
    payload = room.data or {}
    if isinstance(payload, dict) and payload.get("name"):
        name_value = payload.get("name")
        if isinstance(name_value, str):
            return name_value
    return room.uuid


def _base_queryset():
    latest_message = (
        Message.objects.filter(rooms=OuterRef("pk")).order_by("-created_at")
    )
    ownership = RoomOwnership.objects.filter(room=OuterRef("pk"))

    queryset = (
        Room.objects.all()
        .annotate(
            last_message_at=Subquery(
                latest_message.values("created_at")[:1]
            ),
            last_text=Subquery(latest_message.values("body")[:1]),
            activity_at=Coalesce(
                Subquery(latest_message.values("created_at")[:1]),
                models.F("created_at"),
            ),
            ownership_owner_pk=Subquery(ownership.values("owner_id")[:1]),
            ownership_owner_supabase_uid=Subquery(
                ownership.values("owner__supabase_uid")[:1]
            ),
        )
        .order_by("-activity_at", "-uuid")
    )
    return queryset


def _coerce_limit(value: int | None) -> int:
    if value is None:
        return _DEFAULT_LIMIT
    try:
        limit = int(value)
    except (TypeError, ValueError) as exc:  # pragma: no cover - defensive
        raise ValueError("Invalid limit") from exc
    if limit <= 0:
        raise ValueError("Invalid limit")
    return min(limit, _MAX_LIMIT)


def _encode_cursor(activity: datetime, room_uuid: str) -> str:
    payload = {
        "activity": activity.isoformat(),
        "uuid": room_uuid,
    }
    raw = json.dumps(payload).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _parse_cursor(value: str | None) -> tuple[datetime, str] | None:
    if not value:
        return None
    padding = "=" * (-len(value) % 4)
    try:
        raw = base64.urlsafe_b64decode(f"{value}{padding}".encode("utf-8"))
    except binascii.Error as exc:  # pragma: no cover - defensive
        raise ValueError("Invalid cursor") from exc
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:  # pragma: no cover - defensive
        raise ValueError("Invalid cursor") from exc
    activity_raw = payload.get("activity")
    if not activity_raw:
        raise ValueError("Invalid cursor")
    activity = datetime.fromisoformat(activity_raw)
    if activity.tzinfo is None:
        activity = activity.replace(tzinfo=timezone.utc)
    return activity, payload["uuid"]
