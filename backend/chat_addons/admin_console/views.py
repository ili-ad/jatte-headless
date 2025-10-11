from __future__ import annotations

from dataclasses import asdict

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

from .serializers import (
    ClaimRoomSerializer,
    GatingRulesSerializer,
    IntakeActionResponseSerializer,
    IntakeListResponseSerializer,
    QueueRoomSerializer,
)
from .services import gating, triage


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


class GatingRulesView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        rules = gating.get_rules()
        serializer = GatingRulesSerializer(gating.serialize_rules(rules))
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request: Request) -> Response:
        serializer = GatingRulesSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        rules = gating.update_rules(serializer.validated_data)
        payload = GatingRulesSerializer(gating.serialize_rules(rules))
        return Response(payload.data, status=status.HTTP_200_OK)


class IntakeListView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        status_param = request.query_params.get("status")
        limit_param = request.query_params.get("limit")
        cursor_param = request.query_params.get("cursor")

        result = gating.list_intake(
            status=status_param,
            limit=int(limit_param) if limit_param else None,
            cursor=cursor_param,
        )
        payload = {
            "results": [
                {
                    "message_id": item.message_id,
                    "cid": item.cid,
                    "user_id": item.user_id,
                    "text": item.text,
                    "created_at": item.created_at,
                    "status": item.status,
                    "reason": item.reason,
                }
                for item in result.results
            ],
            "next": result.next_cursor,
        }
        serializer = IntakeListResponseSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ApproveIntakeView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, message_id: str) -> Response:
        result = gating.approve_intake(message_id=message_id, actor=request.user)
        serializer = IntakeActionResponseSerializer(asdict(result))
        return Response(serializer.data, status=status.HTTP_200_OK)


class RejectIntakeView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, message_id: str) -> Response:
        payload = request.data or {}
        reason = payload.get("reason") or "spam"
        mute_raw = payload.get("mute")
        mute = False
        if isinstance(mute_raw, bool):
            mute = mute_raw
        elif isinstance(mute_raw, str):
            mute = mute_raw.lower() in {"1", "true", "yes", "on"}

        result = gating.reject_intake(
            message_id=message_id,
            actor=request.user,
            reason=reason,
            mute=mute,
        )
        serializer = IntakeActionResponseSerializer(asdict(result))
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
