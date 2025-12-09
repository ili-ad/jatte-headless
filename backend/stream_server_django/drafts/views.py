"""HTTP endpoints for persisting per-room message drafts."""

from __future__ import annotations

from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from stream_server_django.accounts_supabase.authentication import DevTokenOrJWTAuthentication
from stream_server_django.common.identity import get_chat_identity
from stream_server_django.chat.models import Draft

from .serializers import DraftSerializer
from stream_server_django.rooms.utils import get_room_or_404, user_has_room_access


class RoomDraftView(APIView):
    """Expose CRUD-style operations for a user's room-scoped draft."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request, room_uuid: str) -> Response:
        identity = get_chat_identity(request)
        user = identity.as_user()
        room = get_room_or_404(room_uuid)
        if not user_has_room_access(user, room):
            return Response(status=status.HTTP_403_FORBIDDEN)

        draft = Draft.objects.filter(room=room, user=user).first()
        if not draft:
            return Response({"draft": None})

        serializer = DraftSerializer(draft)
        return Response({"draft": serializer.data})

    def post(self, request: Request, room_uuid: str) -> Response:
        identity = get_chat_identity(request)
        user = identity.as_user()
        room = get_room_or_404(room_uuid)
        if not user_has_room_access(user, room):
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = DraftSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        draft, _created = Draft.objects.get_or_create(room=room, user=user)
        draft.text = serializer.validated_data["text"]
        draft.save(update_fields=["text", "updated_at"])

        output = DraftSerializer(draft)
        return Response({"draft": output.data})

    def delete(self, request: Request, room_uuid: str) -> Response:
        identity = get_chat_identity(request)
        user = identity.as_user()
        room = get_room_or_404(room_uuid)
        if not user_has_room_access(user, room):
            return Response(status=status.HTTP_403_FORBIDDEN)

        Draft.objects.filter(room=room, user=user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
