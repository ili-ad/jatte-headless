from __future__ import annotations

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
