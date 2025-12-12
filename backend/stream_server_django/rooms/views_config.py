"""Views exposing room-level configuration state."""

from __future__ import annotations

from copy import deepcopy

from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from stream_server_django.accounts_supabase.utils import is_at_least_guest_identity
from stream_server_django.accounts_supabase.authentication import DevTokenOrJWTAuthentication
from stream_server_django.chat.utils import canonical_cid

from .serializers import RoomConfigStateSerializer
from .utils import get_room_or_404, is_public_agent_room, user_has_room_access

try:  # pragma: no cover - optional agent addon
    from stream_server_django.chat_addons.agent.utils import agent_enabled_for_room, agent_user_id_for_room
except Exception:  # pragma: no cover - defensive fallback
    agent_enabled_for_room = None  # type: ignore[assignment]
    agent_user_id_for_room = None  # type: ignore[assignment]

_DEFAULT_COMPOSER_CONFIG = {
    "file_uploads": True,
    "max_length": 5000,
    "cooldown_seconds": 0,
}


class RoomConfigStateView(APIView):
    """Return message composer flags for a given room."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request, room_uuid: str) -> Response:
        room = get_room_or_404(room_uuid)
        if not user_has_room_access(request.user, room):
            if not (is_public_agent_room(room) and is_at_least_guest_identity(request)):
                return Response(status=status.HTTP_403_FORBIDDEN)

        canonical = canonical_cid(room_uuid, room_uuid=room.uuid)
        composer = deepcopy(_DEFAULT_COMPOSER_CONFIG)
        room_data = room.data or {}
        room_composer = room_data.get("composer")
        if isinstance(room_composer, dict):
            for key, value in room_composer.items():
                if key in composer and value is not None:
                    composer[key] = value

        ai_config = _build_ai_config(canonical, room, room_data)

        serializer = RoomConfigStateSerializer(
            {"config": {"composer": composer, "ai": ai_config}}
        )
        return Response(serializer.data)


def _build_ai_config(canonical: str, room, room_data: dict | None) -> dict:
    enabled = bool(agent_enabled_for_room(canonical, room)) if agent_enabled_for_room else False
    bot_user_id = (
        agent_user_id_for_room(canonical)
        if agent_user_id_for_room
        else f"room:{room.uuid}:bot"
    )
    persona_summary = None
    if isinstance(room_data, dict):
        summary = room_data.get("personaSummary") or room_data.get("persona_summary")
        persona_summary = summary if isinstance(summary, str) else None

    return {
        "enabled": enabled,
        "botUserId": bot_user_id,
        "displayName": "Assistant",
        "personaSummary": persona_summary,
    }
