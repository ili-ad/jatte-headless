from __future__ import annotations

from django.db import transaction

from stream_server_django.chat.contact_rooms import (
    CONTACT_ROOM_KIND,
    get_or_create_contact_room as _get_or_create_contact_room_by_key,
)
from stream_server_django.chat.models import Room
from stream_server_django.common.identity import ChatIdentity

__all__ = ["CONTACT_ROOM_KIND", "contact_identity_key", "get_or_create_contact_room"]


def contact_identity_key(identity: ChatIdentity) -> str:
    """Derive a stable identifier for the caller's contact room."""

    for candidate in (identity.supabase_uid, identity.id, identity.username):
        if candidate:
            return str(candidate)

    raise ValueError("ChatIdentity does not expose a usable contact identifier")


@transaction.atomic
def get_or_create_contact_room(identity: ChatIdentity) -> Room:
    """Return the per-identity contact room, creating it if needed."""

    if not isinstance(identity, ChatIdentity):
        raise TypeError("get_or_create_contact_room expects a ChatIdentity instance")

    identity_key = contact_identity_key(identity)
    room = _get_or_create_contact_room_by_key(identity_key)

    data = room.data or {}
    update_fields: set[str] = set()

    if identity.supabase_uid and data.get("contact_identity_supabase_uid") != identity.supabase_uid:
        data["contact_identity_supabase_uid"] = identity.supabase_uid
        update_fields.add("data")

    if identity.id is not None and data.get("contact_identity_id") != identity.id:
        data["contact_identity_id"] = identity.id
        update_fields.add("data")

    if identity.username and data.get("contact_identity_username") != identity.username:
        data["contact_identity_username"] = identity.username
        update_fields.add("data")

    if update_fields:
        room.data = data
        room.save(update_fields=list(update_fields))

    return room
