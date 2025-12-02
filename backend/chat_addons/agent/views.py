from __future__ import annotations

import logging
import time
from typing import Any, Sequence

from django.db import transaction
from django.db.models import Q
from rest_framework import serializers, status
from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts_supabase.authentication import DevTokenOrJWTAuthentication
from chat.models import Message, Room
from chat.utils import canonical_cid

from ..common_audit.decorators import audit_action
from ..common_audit.models import AuditTrail
from ..common_audit.throttling import (
    AgentInvokeRateThrottle,
    AgentToggleRateThrottle,
)
from . import registry
from .models import AgentRoomPolicy, AgentRun, RoomAgentFlag
from .serializers import (
    AgentInvocationSerializer,
    AgentMemoryListQuerySerializer,
    AgentMemoryListSerializer,
    AgentRoomPolicySerializer,
    AgentRunListQuerySerializer,
    AgentRunSummarySerializer,
    AgentSimulateRequestSerializer,
    RoomSkillListSerializer,
    RoomSkillPolicySerializer,
)
from ..common_audit.models import MessageProvenance
from .tasks import _persist_message
from .services.agent_service import get_agent_service
from .services.memory import MemoryService
from .utils import agent_enabled_for_room, agent_user_id_for_room

logger = logging.getLogger(__name__)

_MEMORY_SERVICE = MemoryService()


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
        enabled = agent_enabled_for_room(canonical, room)
        payload = {
            "cid": canonical,
            "agent_enabled": enabled,
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
        canonical, room = _resolve_room(cid)
        RoomAgentFlag.objects.get_or_create(room=room)
        request._audit_context = {"cid": canonical}
        data = request.data or {}
        serializer = AgentInvocationSerializer(data=data)
        echo_text: str

        if serializer.is_valid():
            room_uuid = serializer.validated_data["room_uuid"]
            if room_uuid and room_uuid != room.uuid:
                return Response(
                    {"detail": "Room does not match invocation payload."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            message_id = serializer.validated_data["last_human_message_id"]
            message = Message.objects.filter(channel__uuid=room.uuid, id=message_id).first()
            if not message:
                return Response(
                    {"detail": "Message not found for this room."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            bot_user_id = agent_user_id_for_room(canonical)
            if message.sent_by == bot_user_id:
                return Response(
                    {"detail": "Agent replies cannot be chained."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            echo_text = message.body or ""
        elif "prompt" in data:
            fallback_serializer = AgentInvokeRequestSerializer(data=data)
            fallback_serializer.is_valid(raise_exception=True)
            echo_text = fallback_serializer.validated_data["prompt"]
        else:
            raise serializers.ValidationError(serializer.errors or {})
        agent_message = _persist_message(cid=canonical, text=f"Echo: {echo_text}")

        logger.info(
            "AgentInvokeView created agent message id=%s cid=%s text=%r",
            agent_message.id,
            canonical,
            agent_message.body,
        )

        MessageProvenance.objects.get_or_create(
            message=agent_message,
            defaults={"source": MessageProvenance.Source.AGENT},
        )

        payload = {
            "messages": [
                {
                    "id": str(agent_message.id),
                    "room_uuid": agent_message.channel.uuid,
                    "user_id": agent_message.sent_by,
                    "role": "assistant",
                    "text": agent_message.body,
                    "created_at": agent_message.created_at,
                    "custom_data": agent_message.custom_data or {},
                }
            ],
            "reason": "echo",
        }

        request._audit_context = {
            "cid": canonical,
            "target_id": str(agent_message.id),
            "meta": {"reason": "echo"},
        }

        return Response(payload, status=status.HTTP_200_OK)

class AgentLLMInvokeView(APIView):
    """
    Invoke the room's agent using the AgentService orchestration pipeline.

    This is similar to AgentInvokeView, but instead of echoing the last
    human message, it calls AgentService.generate(), which goes through
    the LLM client (and eventually RAG, tools, memory, etc).

    AgentInvokeView remains as a simple echo endpoint for smoke tests.
    """

    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]
    throttle_classes = [AgentInvokeRateThrottle]

    @audit_action(action=AuditTrail.Action.AGENT_INVOKE, cid_kwarg="cid")
    def post(self, request: Request, cid: str) -> Response:
        trace_id: str | None = None
        canonical: str | None = None
        logger.info("agent.llm.invoke.http_start", extra={"cid": cid})

        def _log_http_end(response: Response, **extra: Any) -> Response:
            payload = {
                "cid": canonical or cid,
                "trace_id": trace_id,
                "status_code": response.status_code,
            }
            payload.update({k: v for k, v in extra.items() if v is not None})
            logger.info("agent.llm.invoke.http_end", extra=payload)
            return response

        try:
            # Normalize CID + room and mark that this room has ever used an agent
            canonical, room = _resolve_room(cid)
            RoomAgentFlag.objects.get_or_create(room=room)
            request._audit_context = {"cid": canonical}

            data = request.data or {}
            serializer = AgentInvocationSerializer(data=data)
            serializer.is_valid(raise_exception=True)

            room_uuid = serializer.validated_data.get("room_uuid")
            if room_uuid and room_uuid != room.uuid:
                return _log_http_end(
                    Response(
                    {"detail": "Room does not match invocation payload."},
                    status=status.HTTP_400_BAD_REQUEST,
                    )
                )

            # Respect per-room agent enablement
            if not agent_enabled_for_room(canonical, room):
                return _log_http_end(
                    Response(
                    {"detail": "Agent is disabled for this room."},
                    status=status.HTTP_400_BAD_REQUEST,
                    )
                )

            # Look up the last human message we are supposed to respond to
            message_id = serializer.validated_data["last_human_message_id"]
            message = Message.objects.filter(
                channel__uuid=room.uuid, id=message_id
            ).first()
            if not message:
                return _log_http_end(
                    Response(
                    {"detail": "Message not found for this room."},
                    status=status.HTTP_404_NOT_FOUND,
                    )
                )

            # Don't chain replies back into the agent
            bot_user_id = agent_user_id_for_room(canonical)
            if message.sent_by == bot_user_id:
                return _log_http_end(
                    Response(
                    {"detail": "Agent replies cannot be chained."},
                    status=status.HTTP_400_BAD_REQUEST,
                    )
                )

            # -----------------------------
            # Call into the AgentService / LLM
            # -----------------------------
            trace_id = serializer.validated_data.get("trace_id")

            meta: dict[str, Any] = {
                "source": "AgentLLMInvokeView",
                "invocation": "llm_invoke",
                "cid": canonical,
                "room_uuid": str(room.uuid),
                "room_name": getattr(room, "name", None),
                "request_id": trace_id,
                # 🔹 current hard-coded RAG flags
                "use_rag": True,
                "state": "FL",
                # optionally: "rag_topic": "noc_compliance" or whatever
            }

            service = get_agent_service()
            meta["job_request_id"] = trace_id

            job_id = service.enqueue_generate(
                cid=canonical,
                user_id=str(getattr(request.user, "id", "")) or None,
                text=message.body or "",
                meta=meta,
                request_id=trace_id,
            )

            payload = {
                "status": "queued",
                "job_id": job_id,
                "trace_id": trace_id,
            }
            request._audit_context = {"cid": canonical, "meta": payload}
            response = Response(payload, status=status.HTTP_202_ACCEPTED)
            return _log_http_end(response, job_id=job_id)

        except Exception:
            # This is the safety net we were missing: log the full stack trace.
            logger.exception(
                "agent.llm.invoke.unhandled_error", extra={"cid": cid, "trace_id": trace_id}
            )
            response = Response(
                {"detail": "Agent invocation failed unexpectedly."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
            return _log_http_end(response)




class AgentRagView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = AgentInvocationSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        room_identifier = serializer.validated_data["room_uuid"]
        canonical, room = _resolve_room(room_identifier)
        if not agent_enabled_for_room(canonical, room):
            return Response(
                {"detail": "Agent disabled for this room."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message_id = serializer.validated_data["last_human_message_id"]
        message = Message.objects.filter(channel__uuid=room.uuid, id=message_id).first()
        if not message:
            return Response(
                {"detail": "Message not found for this room."},
                status=status.HTTP_404_NOT_FOUND,
            )

        bot_user_id = agent_user_id_for_room(canonical)
        if message.sent_by == bot_user_id:
            return Response(
                {"detail": "Agent replies cannot be chained."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        meta = {
            "last_human_message_id": message_id,
            "client_generated_id": serializer.validated_data.get("client_generated_id"),
            "trace_id": serializer.validated_data.get("trace_id"),
            # RAG flags:
            "use_rag": True,
            "state": "FL",
            # Optionally: "rag_topic": "noc_compliance" or similar, if you want.            
        }

        service = get_agent_service()
        reply = service.generate(
            cid=canonical,
            user_id=str(getattr(request.user, "id", "")) or None,
            text=message.body,
            meta={k: v for k, v in meta.items() if v is not None},
            request_id=serializer.validated_data.get("trace_id"),
        )

        messages = [
            {
                "id": str(msg.id),
                "room_uuid": msg.channel.uuid,
                "user_id": msg.sent_by,
                "role": "assistant",
                "text": msg.body,
                "created_at": msg.created_at,
                "custom_data": msg.custom_data or {},
            }
            for msg in reply.messages or []
        ]

        return Response(
            {
                "messages": messages,
                "reason": reply.reason,
            },
            status=status.HTTP_200_OK,
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


class AgentRunListView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        serializer = AgentRunListQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        canonical = canonical_cid(serializer.validated_data["cid"])
        limit = serializer.validated_data.get("limit") or 25
        cursor = serializer.validated_data.get("cursor")

        queryset = AgentRun.objects.filter(cid=canonical).order_by("-created_at", "-id")

        if cursor:
            try:
                cursor_run = AgentRun.objects.get(run_id=cursor, cid=canonical)
            except AgentRun.DoesNotExist as exc:
                raise serializers.ValidationError({"cursor": "Invalid cursor"}) from exc
            queryset = queryset.filter(
                Q(created_at__lt=cursor_run.created_at)
                | (Q(created_at=cursor_run.created_at) & Q(id__lte=cursor_run.id))
            )

        entries = list(queryset[: limit + 1])
        next_cursor = None
        if len(entries) > limit:
            next_cursor = entries[limit].run_id
            entries = entries[:limit]

        payload = {
            "results": AgentRunSummarySerializer(entries, many=True).data,
            "next": next_cursor,
        }
        return Response(payload, status=status.HTTP_200_OK)


class AgentMemoryListView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        serializer = AgentMemoryListQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        canonical = canonical_cid(serializer.validated_data["cid"])
        limit = serializer.validated_data.get("limit") or 20
        cursor = serializer.validated_data.get("cursor")

        payload = _MEMORY_SERVICE.list_memory(cid=canonical, limit=limit, cursor=cursor)
        response = AgentMemoryListSerializer(data=payload)
        response.is_valid(raise_exception=True)
        return Response(response.data, status=status.HTTP_200_OK)


class AgentSimulateView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated]
    throttle_classes = [AgentInvokeRateThrottle]

    def post(self, request: Request) -> Response:
        serializer = AgentSimulateRequestSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        canonical = canonical_cid(serializer.validated_data["cid"])
        prompt = serializer.validated_data["prompt"]
        meta = serializer.validated_data.get("meta", {})

        service = get_agent_service()
        result = service.simulate(cid=canonical, prompt=prompt, meta=meta)

        payload = {
            "reply": result.reply,
            "tools_used": result.tools_used,
            "latency_ms": result.latency_ms,
            "tokens_in": result.tokens_in,
            "tokens_out": result.tokens_out,
            "cost_usd": float(result.cost_usd),
            "status": result.status,
        }
        return Response(payload, status=status.HTTP_200_OK)
