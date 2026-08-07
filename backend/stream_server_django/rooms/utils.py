"""Shared helpers for room-scoped endpoints."""

from __future__ import annotations

from django.conf import settings
from django.db.models import Q, QuerySet
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied

from stream_server_django.chat.models import Message, Room
from stream_server_django.common.identity import ChatIdentity


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

    identity = ChatIdentity(user)
    identifiers: set[str] = set()
    username = identity.username
    if username:
        identifiers.add(username)
    supabase_uid = identity.supabase_uid
    if supabase_uid:
        identifiers.add(supabase_uid)
    user_id = identity.id
    if user_id:
        identifiers.add(str(user_id))
    return identifiers


def user_has_room_access(user, room: Room) -> bool:
    """Return whether ``user`` may interact with ``room``.

    This is the repository's legacy-compatible membership policy. Access is
    granted to staff/superusers, the room agent, an identity matching
    ``room.client``, or an identity that previously sent a message attached to
    the room. The prior-message rule is intentionally retained for Stream shim
    compatibility until the project adopts an explicit membership table.
    """

    identity = ChatIdentity(user)

    if not identity.is_authenticated:
        return False

    if identity.is_superuser or identity.is_staff:
        return True

    identifiers = _user_identifiers(identity.user)
    if not identifiers:
        identifiers = set()

    if room.agent_id == identity.id:
        return True

    if room.client and room.client in identifiers:
        return True

    if identifiers and room.messages.filter(sent_by__in=identifiers).exists():
        return True

    return False


def rooms_accessible_to_user(user, queryset: QuerySet | None = None) -> QuerySet:
    """Filter a room queryset using the same policy as ``user_has_room_access``."""

    rooms = queryset if queryset is not None else Room.objects.all()
    identity = ChatIdentity(user)
    if not identity.is_authenticated:
        return rooms.none()
    if identity.is_staff or identity.is_superuser:
        return rooms

    identifiers = _user_identifiers(identity.user)
    access_query = Q(agent_id=identity.id)
    if identifiers:
        access_query |= Q(client__in=identifiers)
        access_query |= Q(messages__sent_by__in=identifiers)
    return rooms.filter(access_query).distinct()


def require_room_access(user, room: Room) -> Room:
    """Return ``room`` or raise a consistent authenticated-access error."""

    if not user_has_room_access(user, room):
        raise PermissionDenied()
    return room


def get_room_for_user_or_404(identifier: str, user) -> Room:
    """Resolve an existing room and require access without creating state."""

    return require_room_access(user, get_room_or_404(identifier))


def require_message_room_access(
    user, message: Message, *, room: Room | None = None
) -> Room:
    """Require access to a parent room containing ``message``.

    When a route supplies a room, the message must belong to that exact room.
    Direct message-ID routes succeed only when at least one attached parent room
    is accessible. Messages unattached to a room are not REST-accessible.
    """

    if room is not None:
        if not room.messages.filter(pk=message.pk).exists():
            raise Http404
        return require_room_access(user, room)

    parent = rooms_accessible_to_user(user, message.rooms.all()).first()
    if parent is not None:
        return parent
    raise PermissionDenied()


def can_admin_room(user, room: Room) -> bool:
    """Return whether ``user`` may perform room-wide administrative mutations."""

    identity = ChatIdentity(user)
    return bool(
        identity.is_authenticated
        and (
            identity.is_staff
            or identity.is_superuser
            or (room.agent_id is not None and room.agent_id == identity.id)
        )
    )


def user_is_room_participant(user, room: Room) -> bool:
    """Return membership evidence without the global staff access override."""

    identity = ChatIdentity(user)
    if not identity.is_authenticated:
        return False
    identifiers = _user_identifiers(identity.user)
    return bool(
        (room.agent_id is not None and room.agent_id == identity.id)
        or (room.client and room.client in identifiers)
        or (
            identifiers
            and room.messages.filter(sent_by__in=identifiers).exists()
        )
    )


def user_is_message_author(user, message: Message) -> bool:
    """Match a message sender against all stable identifiers for ``user``."""

    identity = ChatIdentity(user)
    return bool(
        message.sent_by and message.sent_by in _user_identifiers(identity.user)
    )


def can_mutate_message(user, room: Room, message: Message) -> bool:
    """Allow message mutation to its author or a room administrator."""

    return user_is_message_author(user, message) or can_admin_room(user, room)


def is_public_agent_room(room: Room) -> bool:
    """Return ``True`` when ``room`` is eligible for public agent access.

    Public rooms are defined via the ``PUBLIC_AGENT_ROOM_SLUGS`` setting, which
    is a comma-separated list of identifiers (room ``uuid`` or ``client``) that
    may be read by guest/anonymous Supabase sessions for limited endpoints like
    ``config-state``. The default is closed (no public rooms).
    """

    allowlist = getattr(settings, "PUBLIC_AGENT_ROOM_SLUGS", []) or []
    if not allowlist:
        return False

    room_data = room.data if isinstance(room.data, dict) else {}
    candidates = [room.uuid, room.client, room_data.get("slug"), room_data.get("room_slug")]
    return any(candidate in allowlist for candidate in candidates if candidate)
