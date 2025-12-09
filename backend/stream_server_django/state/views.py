"""Views supporting the State & Recovery domain."""

from __future__ import annotations

from typing import Any

from django.utils import timezone
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from stream_server_django.accounts_supabase.authentication import DevTokenOrJWTAuthentication
from stream_server_django.common.identity import get_chat_identity
from stream_server_django.chat.models import Notification, Room

from .serializers import (
    EditingAuditStateSerializer,
    NotificationSnapshotSerializer,
    RoomSnapshotSerializer,
)


def _coerce_room_data(value: Any) -> dict[str, Any]:
    """Ensure room metadata is always represented as a dictionary."""

    if isinstance(value, dict):
        return value
    return {}


@api_view(["GET"])
@authentication_classes([DevTokenOrJWTAuthentication])
@permission_classes([IsAuthenticated])
def recover_state(request: Request) -> Response:
    """Return rooms and notifications required for a cold start."""

    rooms = Room.objects.all().order_by("id")
    room_payload = []
    for room in rooms:
        data = _coerce_room_data(room.data)
        room_payload.append(
            {
                "id": room.id,
                "uuid": room.uuid,
                "name": data.get("name") or room.uuid,
                "data": data,
            }
        )

    rooms_serialized = RoomSnapshotSerializer(room_payload, many=True).data

    identity = get_chat_identity(request)
    user = identity.as_user()
    notifications = Notification.objects.filter(user=user).order_by(
        "-created_at"
    )
    note_payload = []
    for notification in notifications:
        ts = timezone.localtime(notification.created_at)
        note_payload.append(
            {
                "type": "notification",
                "payload": {"text": notification.text},
                "ts": ts,
            }
        )

    notifications_serialized = NotificationSnapshotSerializer(
        note_payload, many=True
    ).data

    return Response(
        {"stream_server_django.rooms": rooms_serialized, "notifications": notifications_serialized}
    )


@api_view(["GET"])
@authentication_classes([DevTokenOrJWTAuthentication])
@permission_classes([IsAuthenticated])
def is_disconnected(request: Request) -> Response:
    """Expose a boolean flag indicating if the client is disconnected."""

    return Response({"disconnected": False})


@api_view(["GET"])
@authentication_classes([DevTokenOrJWTAuthentication])
@permission_classes([IsAuthenticated])
def is_initialized(request: Request) -> Response:
    """Expose a boolean flag indicating if the client has initialized."""

    return Response({"initialized": True})


@api_view(["POST"])
@authentication_classes([DevTokenOrJWTAuthentication])
@permission_classes([IsAuthenticated])
def editing_audit_state(request: Request) -> Response:
    """Echo the editing audit payload back to the caller for diagnostics."""

    serializer = EditingAuditStateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return Response(serializer.validated_data)
