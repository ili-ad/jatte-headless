"""Views exposing room-level configuration state."""

from __future__ import annotations

from copy import deepcopy

from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts_supabase.authentication import DevTokenOrJWTAuthentication

from .serializers import RoomConfigStateSerializer
from .utils import get_room_or_404, user_has_room_access

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
            return Response(status=status.HTTP_403_FORBIDDEN)

        composer = deepcopy(_DEFAULT_COMPOSER_CONFIG)
        room_data = room.data or {}
        room_composer = room_data.get("composer")
        if isinstance(room_composer, dict):
            for key, value in room_composer.items():
                if key in composer and value is not None:
                    composer[key] = value

        serializer = RoomConfigStateSerializer({"composer": composer})
        return Response(serializer.data)
