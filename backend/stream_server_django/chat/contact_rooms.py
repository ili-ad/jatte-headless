"""Helpers for managing per-user contact rooms."""

from __future__ import annotations

from typing import Iterable, List
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.db import transaction

from stream_server_django.common.identity import ChatIdentity

from .models import Room

User = get_user_model()

CONTACT_ROOM_KIND = "contact"

__all__ = ["CONTACT_ROOM_KIND", "get_or_create_contact_room"]


def _user_identifiers(user: User) -> List[str]:
    """Return stable identifiers associated with the given user.

    Preference order: supabase_uid, username, primary key.
    Blank / falsy identifiers are filtered out.
    """

    identity = ChatIdentity(user)
    identifiers: list[str] = []
    for candidate in (identity.supabase_uid, identity.username, identity.id):
        if candidate:
            identifiers.append(str(candidate))
    # Preserve order while removing duplicates
    seen: set[str] = set()
    unique: list[str] = []
    for value in identifiers:
        if value in seen:
            continue
        seen.add(value)
        unique.append(value)
    return unique


def _find_contact_room(identifiers: Iterable[str]) -> Room | None:
    """Return an existing contact room matching any of the identifiers."""

    return (
        Room.objects.filter(data__kind="contact", client__in=list(identifiers))
        .order_by("-created_at")
        .first()
    )


@transaction.atomic
def get_or_create_contact_room(user: User) -> Room:
    """Return the per-user contact room for ``user``, creating it if needed.

    The returned room:
    - is marked with ``data["kind"] == "contact"`` and ``data["is_private"] == True``
    - uses the user's identifier as ``client`` to guarantee membership/access
    - exposes ``room.uuid`` and ``room.cid`` for downstream callers
    """

    identifiers = _user_identifiers(user)
    if not identifiers:
        raise ValueError("User must provide at least one identifier")

    room = _find_contact_room(identifiers)
    if room:
        return room

    preferred_identifier = identifiers[0]
    data = {"kind": "contact", "is_private": True}
    room = Room.objects.create(uuid=str(uuid4()), client=preferred_identifier, data=data)
    return room
