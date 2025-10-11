from __future__ import annotations

import uuid
from typing import Any, Sequence

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
from . import registry
from .models import AgentRoomPolicy, RoomAgentFlag
from .serializers import (
    AgentRoomPolicySerializer,
    RoomSkillListSerializer,
    RoomSkillPolicySerializer,
)
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

            policy, _ = AgentRoomPolicy.objects.select_for_update().get_or_create(
                cid=canonical
            )
            policy.agent_enabled = True
            policy.save(update_fields=["agent_enabled", "updated_at"])
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

            policy, _ = AgentRoomPolicy.objects.select_for_update().get_or_create(
                cid=canonical
            )
            policy.agent_enabled = False
            policy.save(update_fields=["agent_enabled", "updated_at"])
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


def _build_skill_payload(
    canonical: str, configured_names: Sequence[str] | None
) -> dict[str, Any]:
    metas = registry.list_all()
    known_names = {meta.name for meta in metas}
    default_enabled = {meta.name for meta in metas if meta.enabled_by_default}
    if configured_names is None:
        configured = default_enabled
    else:
        configured = {name for name in configured_names if name in known_names}

    skills = [
        {
            "name": meta.name,
            "enabled": meta.name in configured,
            "description": meta.description,
        }
        for meta in metas
    ]
    payload = {"cid": canonical, "skills": skills}
    serializer = RoomSkillListSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    return serializer.validated_data


class AgentSkillPolicyView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        cid_param = request.query_params.get("cid")
        if not cid_param:
            raise serializers.ValidationError({"cid": "This query parameter is required."})

        canonical, _ = _resolve_room(cid_param)
        policy = AgentRoomPolicy.objects.filter(cid=canonical).first()
        configured = policy.enabled_skills if policy else None
        payload = _build_skill_payload(canonical, configured)
        return Response(payload, status=status.HTTP_200_OK)

    def put(self, request: Request) -> Response:
        serializer = RoomSkillPolicySerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        cid = serializer.validated_data["cid"]
        canonical, room = _resolve_room(cid)
        requested = serializer.validated_data["skills"]

        metas = registry.list_all()
        known_names = {meta.name for meta in metas}

        to_enable: list[str] = []
        unknown: list[str] = []
        for entry in requested:
            name = entry["name"]
            if name not in known_names:
                unknown.append(name)
                continue
            if entry["enabled"]:
                to_enable.append(name)

        if unknown:
            raise serializers.ValidationError(
                {"skills": [f"Unknown skill: {name}" for name in sorted(set(unknown))]}
            )

        seen: set[str] = set()
        ordered_enabled: list[str] = []
        for name in to_enable:
            if name not in seen:
                ordered_enabled.append(name)
                seen.add(name)

        policy = AgentRoomPolicy.objects.filter(cid=canonical).first()
        if policy:
            agent_enabled = policy.agent_enabled
        else:
            flag = RoomAgentFlag.objects.filter(room=room).first()
            agent_enabled = bool(flag.agent_enabled) if flag else False

        registry.set_policy(canonical, agent_enabled, ordered_enabled)
        payload = _build_skill_payload(canonical, ordered_enabled)
        return Response(payload, status=status.HTTP_200_OK)


class AgentPolicyView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        cid_param = request.query_params.get("cid")
        if not cid_param:
            raise serializers.ValidationError({"cid": "This query parameter is required."})

        canonical, room = _resolve_room(cid_param)
        flag = RoomAgentFlag.objects.filter(room=room).first()
        defaults = {"agent_enabled": bool(flag.agent_enabled) if flag else False}
        policy, created = AgentRoomPolicy.objects.get_or_create(
            cid=canonical,
            defaults=defaults,
        )
        if not created and flag and policy.agent_enabled != bool(flag.agent_enabled):
            policy.agent_enabled = bool(flag.agent_enabled)
            policy.save(update_fields=["agent_enabled", "updated_at"])

        serializer = AgentRoomPolicySerializer(policy)
        payload = dict(serializer.data)
        payload["cid"] = canonical
        return Response(payload, status=status.HTTP_200_OK)

    def put(self, request: Request) -> Response:
        data = request.data or {}
        cid_value = data.get("cid")
        if not cid_value:
            raise serializers.ValidationError({"cid": "This field is required."})

        canonical, room = _resolve_room(cid_value)
        policy, _ = AgentRoomPolicy.objects.get_or_create(cid=canonical)

        serializer = AgentRoomPolicySerializer(policy, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        enabled_names = validated.get("enabled_skills")
        if enabled_names is not None:
            metas = registry.list_all()
            known = {meta.name for meta in metas}
            unknown = sorted({name for name in enabled_names if name not in known})
            if unknown:
                raise serializers.ValidationError(
                    {"enabled_skills": [f"Unknown skill: {name}" for name in unknown]}
                )
            deduped: list[str] = []
            seen: set[str] = set()
            for name in enabled_names:
                if name not in seen:
                    deduped.append(name)
                    seen.add(name)
            validated["enabled_skills"] = deduped

        for field in (
            "agent_enabled",
            "enabled_skills",
            "tool_hop_cap",
            "turn_cap",
            "auto_reply_mode",
            "handoff_message",
        ):
            if field in validated:
                setattr(policy, field, validated[field])

        if policy.agent_enabled:
            RoomAgentFlag.objects.get_or_create(room=room)
        policy.cid = canonical
        policy.save()

        serializer = AgentRoomPolicySerializer(policy)
        payload = dict(serializer.data)
        payload["cid"] = canonical
        return Response(payload, status=status.HTTP_200_OK)
