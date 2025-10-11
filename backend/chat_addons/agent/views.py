from __future__ import annotations

import uuid
from typing import Any

from django.db import transaction
from rest_framework import serializers, status
from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts_supabase.authentication import DevTokenOrJWTAuthentication
from chat.models import Room
from chat.utils import canonical_cid

from ..common_audit.decorators import audit_action
from ..common_audit.models import AuditTrail
from ..common_audit.throttling import (
    AgentInvokeRateThrottle,
    AgentToggleRateThrottle,
)
from .models import RoomAgentFlag
from .tasks import run_agent_invocation


class AgentToggleResponseSerializer(serializers.Serializer):
    cid = serializers.CharField()
    agent_enabled = serializers.BooleanField()
    updated_at = serializers.DateTimeField(allow_null=True)


class AgentInvokeRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField(allow_blank=False, trim_whitespace=True)
    meta = serializers.DictField(
        child=serializers.JSONField(), required=False, default=dict
    )


class AgentStatusView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, cid: str) -> Response:
        canonical, room = _resolve_room(cid)
        flag = RoomAgentFlag.objects.filter(room=room).first()
        payload = {
            "cid": canonical,
            "agent_enabled": bool(flag.agent_enabled) if flag else False,
            "updated_at": getattr(flag, "updated_at", None),
        }
        serializer = AgentToggleResponseSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AgentEnableView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]
    throttle_classes = [AgentToggleRateThrottle]

    @audit_action(action=AuditTrail.Action.AGENT_ENABLE, cid_kwarg="cid")
    def post(self, request: Request, cid: str) -> Response:
        canonical, room = _resolve_room(cid)
        request._audit_context = {"cid": canonical}
        with transaction.atomic():
            flag, _ = RoomAgentFlag.objects.select_for_update().get_or_create(
                room=room
            )
            flag.agent_enabled = True
            flag.save(update_fields=["agent_enabled", "updated_at"])
        request._audit_context = {
            "cid": canonical,
            "meta": {"agent_enabled": True},
        }
        serializer = AgentToggleResponseSerializer(
            {
                "cid": canonical,
                "agent_enabled": flag.agent_enabled,
                "updated_at": flag.updated_at,
            }
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class AgentDisableView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]
    throttle_classes = [AgentToggleRateThrottle]

    @audit_action(action=AuditTrail.Action.AGENT_DISABLE, cid_kwarg="cid")
    def post(self, request: Request, cid: str) -> Response:
        canonical, room = _resolve_room(cid)
        request._audit_context = {"cid": canonical}
        with transaction.atomic():
            flag, _ = RoomAgentFlag.objects.select_for_update().get_or_create(
                room=room
            )
            flag.agent_enabled = False
            flag.save(update_fields=["agent_enabled", "updated_at"])
        request._audit_context = {
            "cid": canonical,
            "meta": {"agent_enabled": False},
        }
        serializer = AgentToggleResponseSerializer(
            {
                "cid": canonical,
                "agent_enabled": flag.agent_enabled,
                "updated_at": flag.updated_at,
            }
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class AgentInvokeView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]
    throttle_classes = [AgentInvokeRateThrottle]

    @audit_action(action=AuditTrail.Action.AGENT_INVOKE, cid_kwarg="cid")
    def post(self, request: Request, cid: str) -> Response:
        serializer = AgentInvokeRequestSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        canonical, room = _resolve_room(cid)
        RoomAgentFlag.objects.get_or_create(room=room)
        request._audit_context = {"cid": canonical}

        prompt: str = serializer.validated_data["prompt"]
        meta: dict[str, Any] = serializer.validated_data.get("meta", {})

        run_id = str(uuid.uuid4())
        run_agent_invocation.delay(run_id, canonical, prompt, meta)
        request._audit_context = {
            "cid": canonical,
            "target_id": run_id,
            "meta": {"meta_keys": sorted(meta.keys())},
        }

        return Response(
            {"run_id": run_id, "status": "queued"},
            status=status.HTTP_202_ACCEPTED,
        )


def _resolve_room(cid: str) -> tuple[str, Room]:
    canonical = canonical_cid(cid)
    if ":" in canonical:
        _, room_uuid = canonical.split(":", 1)
    else:
        room_uuid = canonical
    room, _ = Room.objects.get_or_create(uuid=room_uuid, defaults={"client": "stream"})
    return canonical, room
