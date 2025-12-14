from __future__ import annotations

from django.conf import settings
from django.db import transaction
from django.utils.text import slugify

from stream_server_django.chat.models import Room
from stream_server_django.chat.utils import canonical_cid

from .config import AGENT_USER_ID
from .models import AgentRoomPolicy, RoomAgentFlag


def room_uuid_from_identifier(identifier: str) -> str:
    """Return the room UUID from a ``cid`` or plain identifier."""

    if ":" in identifier:
        return identifier.split(":", 1)[1]
    return identifier


def agent_user_id_for_room(room_identifier: str) -> str:
    """Return a stable agent user id for the given room."""

    room_uuid = room_uuid_from_identifier(room_identifier)
    prefix = AGENT_USER_ID or "ai-bot"
    return f"{prefix}-{room_uuid}"


def agent_enabled_for_room(room_identifier: str, room: Room | None = None) -> bool:
    """Return whether the agent is enabled for the room represented by ``room_identifier``."""

    canonical = canonical_cid(room_identifier, room_uuid=getattr(room, "uuid", None))
    room_obj = room or Room.objects.filter(uuid=room_uuid_from_identifier(room_identifier)).first()

    policy = AgentRoomPolicy.objects.filter(cid=canonical).first()
    if policy is not None:
        return bool(policy.agent_enabled)

    if room_obj:
        flag = RoomAgentFlag.objects.filter(room=room_obj).first()
        return bool(flag.agent_enabled) if flag else False

    return False


def _default_agent_enabled(room_slug: str | None = None, purpose: str | None = None) -> bool:
    """Return the default agent enablement for a room slug/purpose."""

    configured_slugs = getattr(settings, "DEFAULT_AGENT_ENABLED_SLUGS", []) or []
    configured_purposes = getattr(settings, "DEFAULT_AGENT_ENABLED_PURPOSES", []) or []

    normalized_slug = slugify(room_slug) if room_slug else None
    slug_candidates = {normalized_slug} if normalized_slug else set()
    support_slug = slugify("support/contact-us")

    configured_slug_set = {slugify(item) for item in configured_slugs}
    if normalized_slug and normalized_slug in configured_slug_set:
        return True
    if support_slug in slug_candidates:
        return True
    if purpose and purpose in {"support", "contact", "contact-page", *configured_purposes}:
        return True

    return False


def _persist_default_agent_state(
    *,
    room: Room,
    room_slug: str | None = None,
    purpose: str | None = None,
    cid: str | None = None,
) -> bool:
    """Persist the default agent enablement for a newly created room."""

    canonical = canonical_cid(cid or room.uuid, room_uuid=room.uuid)

    with transaction.atomic():
        policy = AgentRoomPolicy.objects.select_for_update().filter(cid=canonical).first()
        flag = RoomAgentFlag.objects.select_for_update().filter(room=room).first()

        # Respect any existing policy/flag without overwriting.
        if policy or flag:
            return bool(policy.agent_enabled if policy else flag.agent_enabled)

        enabled = _default_agent_enabled(room_slug, purpose)

        flag = RoomAgentFlag.objects.create(room=room, agent_enabled=enabled)
        AgentRoomPolicy.objects.create(cid=canonical, agent_enabled=enabled)

    return bool(flag.agent_enabled)
