from __future__ import annotations

"""Helpers for managing per-user contact rooms."""

import uuid
from typing import Final

from django.db import IntegrityError, transaction

from .models import Room

# Marker stored in ``Room.data`` to differentiate contact rooms from other chats.
CONTACT_ROOM_KIND: Final[str] = "contact-agent"


def _contact_room_uuid(user_key: str) -> str:
    """Return a stable room UUID for the given ``user_key``."""

    namespace = uuid.uuid5(uuid.NAMESPACE_URL, "jatte-headless/contact-room")
    return f"contact-{uuid.uuid5(namespace, user_key)}"


def _ensure_contact_metadata(room: Room, user_key: str) -> None:
    """Ensure the room carries the expected contact-room metadata."""

    update_fields: set[str] = set()
    data = room.data or {}

    if data.get("kind") != CONTACT_ROOM_KIND:
        data["kind"] = CONTACT_ROOM_KIND
        update_fields.add("data")

    if data.get("contact_room") is not True:
        data["contact_room"] = True
        update_fields.add("data")

    if data.get("contact_user_key") != user_key:
        data["contact_user_key"] = user_key
        update_fields.add("data")

    if room.client != user_key:
        room.client = user_key
        update_fields.add("client")

    if update_fields:
        room.data = data
        room.save(update_fields=list(update_fields))


def get_or_create_contact_room(user_key: str) -> Room:
    """
    Return the per-user "contact agent" room for ``user_key``.

    The helper is idempotent and safe under concurrency. It will reuse an
    existing contact room for the same ``user_key`` or create a new one marked
    with contact metadata and the user as the client.
    """

    if not user_key:
        raise ValueError("user_key is required")

    with transaction.atomic():
        existing = (
            Room.objects.select_for_update()
            .filter(client=user_key, data__contact_room=True)
            .first()
        )
        if existing:
            _ensure_contact_metadata(existing, user_key)
            return existing

        room_uuid = _contact_room_uuid(user_key)
        defaults = {
            "client": user_key,
            "data": {
                "kind": CONTACT_ROOM_KIND,
                "contact_room": True,
                "contact_user_key": user_key,
            },
        }

        try:
            room, _created = Room.objects.get_or_create(uuid=room_uuid, defaults=defaults)
        except IntegrityError:
            room = Room.objects.select_for_update().get(uuid=room_uuid)

        _ensure_contact_metadata(room, user_key)
        return room
