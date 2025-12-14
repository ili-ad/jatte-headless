from __future__ import annotations

from django.conf import settings

from stream_server_django.chat.models import Room
from stream_server_django.chat.utils import canonical_cid

from .config import AGENT_USER_ID
from .models import AgentRoomPolicy, RoomAgentFlag


_DEFAULT_AGENT_ENABLE_KEYWORDS = ("agent-lab", "support", "contact-us")


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


def _policy_keywords() -> tuple[str, ...]:
    """Return the keywords used to determine default agent enablement."""

    configured = getattr(settings, "DEFAULT_AGENT_ROOM_KEYWORDS", None)
    if configured:
        return tuple(str(value).lower() for value in configured if value)
    return _DEFAULT_AGENT_ENABLE_KEYWORDS


def should_enable_agent_for_room(
    *, room_slug: str | None, room_uuid: str | None, cid: str | None, purpose: str | None
) -> bool:
    """Return ``True`` when policy marks the room eligible for the agent by default."""

    keywords = _policy_keywords()

    def _matches(value: str | None) -> bool:
        if not value:
            return False
        lower = value.lower()
        return any(keyword in lower for keyword in keywords)

    if _matches(purpose):
        return True

    if _matches(room_slug):
        return True

    if _matches(cid):
        return True

    if _matches(room_uuid):
        return True

    return False


def _persist_default_agent_state(room: Room, *, canonical_cid: str, enabled: bool) -> None:
    """Persist the default agent state without overriding existing choices."""

    RoomAgentFlag.objects.get_or_create(room=room, defaults={"agent_enabled": enabled})
    AgentRoomPolicy.objects.get_or_create(
        cid=canonical_cid, defaults={"agent_enabled": enabled}
    )


def agent_enabled_for_room(room_identifier: str, room: Room | None = None) -> bool:
    """Return whether the agent is enabled for the room represented by ``room_identifier``."""

    canonical = canonical_cid(room_identifier, room_uuid=getattr(room, "uuid", None))
    room_obj = room or Room.objects.filter(uuid=room_uuid_from_identifier(room_identifier)).first()

    # Precedence: manual per-room override beats policy, which beats computed default.
    if room_obj:
        flag = RoomAgentFlag.objects.filter(room=room_obj).first()
        if flag is not None:
            return bool(flag.agent_enabled)

    policy = AgentRoomPolicy.objects.filter(cid=canonical).first()
    if policy is not None:
        return bool(policy.agent_enabled)

    room_slug = None
    purpose = None
    room_data = room_obj.data if room_obj and isinstance(room_obj.data, dict) else {}
    if isinstance(room_data, dict):
        purpose = room_data.get("purpose") or room_data.get("room_purpose")
        slug_candidate = room_data.get("slug") or room_data.get("room_slug")
        label_candidate = room_data.get("label")
        room_slug = slug_candidate or label_candidate

    decision = should_enable_agent_for_room(
        room_slug=room_slug,
        room_uuid=getattr(room_obj, "uuid", None),
        cid=canonical,
        purpose=purpose,
    )

    if room_obj:
        _persist_default_agent_state(room_obj, canonical_cid=canonical, enabled=decision)

    return decision


def apply_default_agent_policy(
    room: Room, *, room_slug: str | None, purpose: str | None, cid: str | None = None
) -> bool:
    """Apply the default agent policy for a newly created room."""

    canonical = canonical_cid(cid or room.uuid, room_uuid=room.uuid)
    decision = should_enable_agent_for_room(
        room_slug=room_slug, room_uuid=room.uuid, cid=canonical, purpose=purpose
    )
    _persist_default_agent_state(room, canonical_cid=canonical, enabled=decision)
    return decision
