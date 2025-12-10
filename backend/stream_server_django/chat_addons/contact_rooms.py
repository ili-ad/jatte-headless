from __future__ import annotations

from typing import Final, Tuple

from django.contrib.auth import get_user_model
from django.db import transaction

from stream_server_django.chat.contact_rooms import CONTACT_ROOM_KIND, get_or_create_contact_room
from stream_server_django.chat.models import Room
from stream_server_django.chat.utils import canonical_cid
from stream_server_django.chat_addons.agent.models import AgentRoomPolicy, RoomAgentFlag
from stream_server_django.common.identity import ChatIdentity

CONTACT_ROOM_PURPOSE: Final[str] = "contact-page"
__all__ = [
    "CONTACT_ROOM_KIND",
    "CONTACT_ROOM_PURPOSE",
    "contact_user_key_for_user",
    "get_or_create_contact_room_for_user",
    "get_or_create_contact_agent_room_for_user",
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


def _agent_username() -> str:
    from stream_server_django.chat_addons.agent.config import AGENT_USER_ID

    return AGENT_USER_ID or "ai-bot"


def _get_or_create_agent_user():
    User = get_user_model()
    username = _agent_username()
    defaults = {"email": f"{username}@example.com"}

    if hasattr(User, "supabase_uid"):
        defaults["supabase_uid"] = username

    user, _ = User.objects.get_or_create(username=username, defaults=defaults)
    return user


def _expected_room_name(identity: ChatIdentity) -> str:
    label = identity.id if identity.id is not None else contact_user_key_for_user(identity.user)
    return f"Contact agent – {label}"


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


@transaction.atomic
def get_or_create_contact_agent_room_for_user(user) -> Tuple[Room, bool]:
    """
    Return the per-user agent-enabled contact room for ``user``.

    The helper is idempotent and ensures:
    - The caller is authenticated.
    - A single contact room exists for the user, reusing an existing one when present.
    - The room is tagged as a contact-agent room with a human-friendly name.
    - The configured agent user is attached to the room and agent replies are enabled.

    Returns a tuple of ``(room, created)`` where ``created`` is ``True`` when a new
    room row was provisioned for the user.
    """

    identity = ChatIdentity(user)
    if not identity.is_authenticated:
        raise ValueError(
            "get_or_create_contact_agent_room_for_user requires an authenticated user"
        )

    user_key = contact_user_key_for_user(identity.user)
    existing = (
        Room.objects.select_for_update()
        .filter(client=user_key, data__contact_room=True)
        .first()
    )
    created = existing is None

    room = existing or get_or_create_contact_room_for_user(identity.user)

    update_fields: set[str] = set()
    data = room.data or {}

    expected_name = _expected_room_name(identity)
    if data.get("name") != expected_name:
        data["name"] = expected_name
        update_fields.add("data")

    if data.get("purpose") != "contact_agent":
        data["purpose"] = "contact_agent"
        update_fields.add("data")

    agent_user = _get_or_create_agent_user()
    if room.agent_id != getattr(agent_user, "id", None):
        room.agent = agent_user
        update_fields.add("agent")

    if update_fields:
        room.data = data
        room.save(update_fields=list(update_fields))

    canonical = canonical_cid(room.uuid, room_uuid=room.uuid)

    flag, _ = RoomAgentFlag.objects.select_for_update().get_or_create(room=room)
    if not flag.agent_enabled:
        flag.agent_enabled = True
        flag.save(update_fields=["agent_enabled", "updated_at"])

    policy, _ = AgentRoomPolicy.objects.select_for_update().get_or_create(
        cid=canonical
    )
    if not policy.agent_enabled:
        policy.agent_enabled = True
        policy.save(update_fields=["agent_enabled", "updated_at"])

    return room, created
