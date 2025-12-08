"""Shared helpers for room-scoped endpoints."""

from __future__ import annotations

from django.shortcuts import get_object_or_404

from stream_server_django.chat.models import Room


def normalize_room_identifier(identifier: str) -> str:
    """Strip Stream-style prefixes (e.g. ``messaging:``) from the identifier."""

    if ":" not in identifier:
        return identifier
    _prefix, room_uuid = identifier.split(":", 1)
    return room_uuid


def get_room_or_404(identifier: str) -> Room:
    """Resolve the provided identifier to an existing :class:`Room`."""

    room_uuid = normalize_room_identifier(identifier)
    return get_object_or_404(Room, uuid=room_uuid)


def _user_identifiers(user) -> set[str]:
    """Collect identifiers that may be associated with the authenticated user."""

    identifiers: set[str] = set()
    username = getattr(user, "username", None)
    if username:
        identifiers.add(username)
    supabase_uid = getattr(user, "supabase_uid", None)
    if supabase_uid:
        identifiers.add(supabase_uid)
    user_id = getattr(user, "id", None)
    if user_id:
        identifiers.add(str(user_id))
    return identifiers


def user_has_room_access(user, room: Room) -> bool:
    """Return ``True`` if the authenticated user can interact with the room."""

    if not getattr(user, "is_authenticated", False):
        return False

    if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
        return True

    identifiers = _user_identifiers(user)
    if not identifiers:
        identifiers = set()

    if room.agent_id == getattr(user, "id", None):
        return True

    if room.client and room.client in identifiers:
        return True

    if identifiers and room.messages.filter(sent_by__in=identifiers).exists():
        return True

    return False
