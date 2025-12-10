from __future__ import annotations

from typing import Final

from django.db import transaction

from stream_server_django.chat.contact_rooms import CONTACT_ROOM_KIND, get_or_create_contact_room
from stream_server_django.chat.models import Room
from stream_server_django.common.identity import ChatIdentity

CONTACT_ROOM_PURPOSE: Final[str] = "contact-page"
__all__ = [
    "CONTACT_ROOM_KIND",
    "CONTACT_ROOM_PURPOSE",
    "contact_user_key_for_user",
    "get_or_create_contact_room_for_user",
]


def contact_user_key_for_user(user) -> str:
    """Return the identifier used to key per-user contact rooms."""

    identity = ChatIdentity(user)
    if not identity.is_authenticated:
        raise ValueError("Authenticated user is required for contact rooms")

    for candidate in (identity.supabase_uid, identity.username, identity.id):
        if candidate:
            return str(candidate)

    raise ValueError("User does not expose a usable contact identifier")


@transaction.atomic
def get_or_create_contact_room_for_user(user) -> Room:
    """
    Return the per-user contact room for ``user``, creating it if needed.

    The helper is idempotent and enforces a single contact room per user
    by delegating to the string-keyed :func:`get_or_create_contact_room`
    helper while ensuring metadata is annotated with user details.
    """

    identity = ChatIdentity(user)
    user_key = contact_user_key_for_user(identity.user)

    room = get_or_create_contact_room(user_key)

    data = room.data or {}
    update_fields: set[str] = set()

    if identity.id is not None and data.get("contact_user_id") != identity.id:
        data["contact_user_id"] = identity.id
        update_fields.add("data")

    if identity.username and data.get("contact_user_username") != identity.username:
        data["contact_user_username"] = identity.username
        update_fields.add("data")

    if update_fields:
        room.data = data
        room.save(update_fields=list(update_fields))

    return room
