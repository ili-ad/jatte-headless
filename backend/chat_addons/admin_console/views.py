from __future__ import annotations

from django.db import transaction
from django.http import Http404
from rest_framework import status
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts_supabase.authentication import DevTokenOrJWTAuthentication
from chat.models import Room

from .serializers import ClaimRoomSerializer, QueueRoomSerializer
from .services import triage


class AdminQueueView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        status_param = request.query_params.get("status", "new")
        if status_param not in {"new", "mine"}:
            raise ValidationError({"status": "Invalid status"})

        limit_param = request.query_params.get("limit")
        cursor_param = request.query_params.get("cursor")
        try:
            result = triage.list_queue(
                user=request.user,
                status=status_param,
                limit=limit_param,
                cursor=cursor_param,
            )
        except ValueError as exc:
            raise ValidationError({"detail": str(exc)}) from exc

        serializer = QueueRoomSerializer(result.results, many=True)
        return Response({"results": serializer.data, "next": result.next_cursor})


class ClaimRoomView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, cid: str) -> Response:
        room = _get_room(cid)
        with transaction.atomic():
            try:
                ownership = triage.claim_room(user=request.user, room=room)
            except PermissionError as exc:
                raise PermissionDenied(str(exc)) from exc

        owner_identifier = _resolve_user_identifier(request.user)
        serializer = ClaimRoomSerializer(
            data={
                "cid": cid,
                "owner_id": owner_identifier,
                "claimed_at": ownership.claimed_at,
            }
        )
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


def _get_room(cid: str) -> Room:
    if ":" in cid:
        _, room_uuid = cid.split(":", 1)
    else:
        room_uuid = cid
    room = Room.objects.filter(uuid=room_uuid).first()
    if not room:
        raise Http404("Room not found")
    return room


def _resolve_user_identifier(user) -> str:
    return getattr(user, "supabase_uid", None) or str(user.pk)
