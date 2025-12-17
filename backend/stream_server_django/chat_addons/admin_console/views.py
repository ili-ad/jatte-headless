from __future__ import annotations

import json
import re
from dataclasses import asdict
from datetime import datetime, timedelta
from uuid import uuid4

from django.db import transaction
from django.http import Http404, HttpResponse
from rest_framework import status
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from stream_server_django.accounts_supabase.authentication import DevTokenOrJWTAuthentication
from stream_server_django.chat.models import Channel, Draft, Message, ReadState, Room
from stream_server_django.chat.utils import canonical_cid
from stream_server_django.common.identity import get_chat_identity
from stream_server_django.chat_addons.permissions import IsChatStaff
from stream_server_django.chat_addons.agent.models import AgentRoomPolicy, AgentRun
from stream_server_django.chat_addons.agent.utils import _persist_default_agent_state

from ..common_audit.decorators import audit_action
from ..common_audit.models import AuditTrail
from ..common_audit.throttling import ClaimRoomRateThrottle, IntakeWriteRateThrottle

from .models import MessageIntake
from .serializers import (
    AgentRunDebugQuerySerializer,
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
    permission_classes = [IsAuthenticated, IsChatStaff]

    def get(self, request: Request) -> Response:
        identity = get_chat_identity(request)
        user = identity.as_user()
        status_param = request.query_params.get("status", "new")
        if status_param not in {"new", "mine"}:
            raise ValidationError({"status": "Invalid status"})

        limit_param = request.query_params.get("limit")
        cursor_param = request.query_params.get("cursor")
        try:
            result = triage.list_queue(
                user=user,
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
    permission_classes = [IsAuthenticated, IsChatStaff]
    throttle_classes = [ClaimRoomRateThrottle]

    @audit_action(action=AuditTrail.Action.CLAIM, cid_kwarg="cid")
    def post(self, request: Request, cid: str) -> Response:
        identity = get_chat_identity(request)
        user = identity.as_user()
        canonical = canonical_cid(cid)
        room = _get_room(canonical)
        request._audit_context = {"cid": canonical, "target_id": room.uuid}

        with transaction.atomic():
            try:
                ownership = triage.claim_room(user=user, room=room)
            except PermissionError as exc:
                raise PermissionDenied(str(exc)) from exc

        owner_identifier = _resolve_user_identifier(user)
        request._audit_context = {
            "cid": canonical,
            "target_id": room.uuid,
            "meta": {"owner_id": owner_identifier},
        }
        serializer = ClaimRoomSerializer(
            data={
                "cid": canonical,
                "owner_id": owner_identifier,
                "claimed_at": ownership.claimed_at,
            }
        )
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ResetRoomView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated, IsChatStaff]

    def post(self, request: Request, room_uuid: str) -> Response:
        room = _get_room(room_uuid)
        deleted_messages = _reset_room(room)

        return Response(
            {
                "ok": True,
                "room_uuid": room.uuid,
                "deleted_messages": deleted_messages,
            },
            status=status.HTTP_200_OK,
        )


class ResetNewRoomView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated, IsChatStaff]

    def post(self, request: Request, room_uuid: str) -> Response:
        room = _get_room(room_uuid)
        label = _get_room_label(room)
        label_slug = _slugify_label(label)

        deleted_messages = _reset_room(room)

        data = room.data if isinstance(room.data, dict) else {}
        new_data = dict(data) if isinstance(data, dict) else {}

        if label:
            new_data["label"] = label
            name_candidate = new_data.get("name") if isinstance(new_data, dict) else None
            if not isinstance(name_candidate, str) or not name_candidate.strip():
                new_data["name"] = label.strip()
            if label_slug:
                new_data["slug"] = label_slug

        new_room = Room.objects.create(
            uuid=str(uuid4()),
            client=room.client,
            url=room.url,
            data=new_data,
        )

        _persist_default_agent_state(room=new_room, room_slug=label_slug, cid=new_room.cid)

        response = Response(
            {
                "ok": True,
                "old_room_uuid": room.uuid,
                "new_room_uuid": new_room.uuid,
                "deleted_messages": deleted_messages,
            },
            status=status.HTTP_200_OK,
        )

        if label_slug:
            cookie_name = f"jatte.room_uuid.{label_slug}"
            response.set_cookie(
                cookie_name,
                new_room.uuid,
                expires=datetime.utcnow() + timedelta(days=60),
                path="/",
                samesite="Lax",
            )

        return response


class GatingRulesView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated, IsChatStaff]

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
    permission_classes = [IsAuthenticated, IsChatStaff]

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


class AgentRunDebugView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated, IsChatStaff]

    def get(self, request: Request):
        serializer = AgentRunDebugQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        try:
            canonical = canonical_cid(serializer.validated_data["cid"])
        except ValueError as exc:
            raise ValidationError({"cid": "Invalid cid"}) from exc
        limit = serializer.validated_data.get("limit") or 10
        fmt = serializer.validated_data.get("format", "text")

        runs = list(
            AgentRun.objects.filter(cid=canonical).order_by("-created_at")[:limit]
        )
        policy = AgentRoomPolicy.objects.filter(cid=canonical).first()

        policy_tool_hop_cap = getattr(policy, "tool_hop_cap", None) if policy else None
        policy_turn_cap = getattr(policy, "turn_cap", None) if policy else None

        run_payloads: list[dict] = []
        for run in runs:
            run_tool_hop_cap = getattr(run, "tool_hop_cap", None)
            run_turn_cap = getattr(run, "turn_cap", None)
            run_payloads.append(
                {
                    "run_id": run.run_id,
                    "created_at": run.created_at.isoformat(),
                    "status": run.status,
                    "handoff": run.handoff,
                    "handoff_reason": run.handoff_reason,
                    "handoff_detail": run.handoff_detail,
                    "tool_hop_cap": run_tool_hop_cap
                    if run_tool_hop_cap is not None
                    else policy_tool_hop_cap,
                    "turn_cap": run_turn_cap if run_turn_cap is not None else policy_turn_cap,
                    "tools_used": run.tools_used,
                    "tokens_in": run.tokens_in,
                    "tokens_out": run.tokens_out,
                    "cost_usd": float(run.cost_usd),
                    "last_tool_name": run.last_tool_name,
                    "last_tool_call_id": run.last_tool_call_id,
                    "last_tool_args_preview": run.last_tool_args_preview,
                }
            )

        if fmt == "json":
            return Response(
                {
                    "cid": canonical,
                    "limit": limit,
                    "policy_tool_hop_cap": policy_tool_hop_cap,
                    "policy_turn_cap": policy_turn_cap,
                    "results": run_payloads,
                },
                status=status.HTTP_200_OK,
            )

        pre_lines = [
            "cid: {cid}".format(cid=canonical),
            f"limit: {limit}",
        ]
        if policy_tool_hop_cap is not None or policy_turn_cap is not None:
            pre_lines.append(
                "policy tool_hop_cap={tool_hop_cap} turn_cap={turn_cap}".format(
                    tool_hop_cap=policy_tool_hop_cap,
                    turn_cap=policy_turn_cap,
                )
            )
        pre_lines.append("")

        for index, payload in enumerate(run_payloads, start=1):
            pre_lines.append(
                "#{idx} run_id={run_id} created_at={created_at} status={status}".format(
                    idx=index,
                    run_id=payload["run_id"],
                    created_at=payload["created_at"],
                    status=payload["status"],
                )
            )
            pre_lines.append(
                "handoff={handoff} reason={reason} detail=\"{detail}\"".format(
                    handoff=payload["handoff"],
                    reason=payload["handoff_reason"],
                    detail=payload["handoff_detail"],
                )
            )
            if payload["tool_hop_cap"] is not None or payload["turn_cap"] is not None:
                pre_lines.append(
                    "tool_hop_cap={tool_hop_cap} turn_cap={turn_cap}".format(
                        tool_hop_cap=payload["tool_hop_cap"],
                        turn_cap=payload["turn_cap"],
                    )
                )
            pre_lines.append(f"tools_used={json.dumps(payload['tools_used'])}")
            pre_lines.append(
                "last_tool={name} call_id={call_id}".format(
                    name=payload["last_tool_name"],
                    call_id=payload["last_tool_call_id"],
                )
            )
            if payload["last_tool_args_preview"]:
                pre_lines.append(
                    f"last_tool_args_preview={payload['last_tool_args_preview']}"
                )
            pre_lines.append(
                "tokens_in={tokens_in} tokens_out={tokens_out} cost_usd={cost_usd}".format(
                    tokens_in=payload["tokens_in"],
                    tokens_out=payload["tokens_out"],
                    cost_usd=payload["cost_usd"],
                )
            )
            pre_lines.append("---")

        pre_body = "\n".join(pre_lines).strip()

        html_body = f"""<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <title>Agent Runs Debug</title>
</head>
<body>
  <button id=\"copy-btn\" type=\"button\">Copy</button>
  <pre id=\"runs\" style=\"white-space: pre-wrap; font-family: SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;\">{pre_body}</pre>
  <script>
    const copyBtn = document.getElementById('copy-btn');
    const pre = document.getElementById('runs');
    if (copyBtn && pre && navigator.clipboard) {{
      copyBtn.addEventListener('click', async () => {{
        try {{
          await navigator.clipboard.writeText(pre.innerText);
          copyBtn.textContent = 'Copied';
          setTimeout(() => copyBtn.textContent = 'Copy', 1500);
        }} catch (err) {{
          copyBtn.textContent = 'Copy failed';
        }}
      }});
    }}
  </script>
</body>
</html>"""

        return HttpResponse(html_body, content_type="text/html")


class ApproveIntakeView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated, IsChatStaff]
    throttle_classes = [IntakeWriteRateThrottle]

    @audit_action(action=AuditTrail.Action.APPROVE, target_kwarg="message_id")
    def post(self, request: Request, message_id: str) -> Response:
        identity = get_chat_identity(request)
        user = identity.as_user()
        base_context = {"target_id": message_id}
        request._audit_context = dict(base_context)
        intake_lookup = (
            MessageIntake.objects.filter(message_id=message_id)
            .values_list("cid", flat=True)
            .first()
        )
        if intake_lookup:
            base_context["cid"] = canonical_cid(intake_lookup)
            request._audit_context = dict(base_context)

        result = gating.approve_intake(message_id=message_id, actor=user)
        enriched_context = dict(base_context)
        enriched_context["meta"] = {
            "status": result.status,
            "muted": result.muted,
        }
        request._audit_context = enriched_context
        serializer = IntakeActionResponseSerializer(asdict(result))
        return Response(serializer.data, status=status.HTTP_200_OK)


class RejectIntakeView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated, IsChatStaff]
    throttle_classes = [IntakeWriteRateThrottle]

    @audit_action(action=AuditTrail.Action.REJECT, target_kwarg="message_id")
    def post(self, request: Request, message_id: str) -> Response:
        identity = get_chat_identity(request)
        user = identity.as_user()
        payload = request.data or {}
        reason = payload.get("reason") or "spam"
        mute_raw = payload.get("mute")
        mute = False
        if isinstance(mute_raw, bool):
            mute = mute_raw
        elif isinstance(mute_raw, str):
            mute = mute_raw.lower() in {"1", "true", "yes", "on"}

        base_context = {"target_id": message_id}
        request._audit_context = dict(base_context)
        intake_lookup = (
            MessageIntake.objects.filter(message_id=message_id)
            .values_list("cid", flat=True)
            .first()
        )
        if intake_lookup:
            base_context["cid"] = canonical_cid(intake_lookup)
            request._audit_context = dict(base_context)

        result = gating.reject_intake(
            message_id=message_id,
            actor=user,
            reason=reason,
            mute=mute,
        )
        enriched_context = dict(base_context)
        enriched_context["meta"] = {
            "status": result.status,
            "muted": result.muted,
        }
        request._audit_context = enriched_context
        serializer = IntakeActionResponseSerializer(asdict(result))
        return Response(serializer.data, status=status.HTTP_200_OK)


class AuditTrailListView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        DevTokenOrJWTAuthentication
    ]
    permission_classes = [IsAuthenticated, IsChatStaff]

    def get(self, request: Request) -> Response:
        limit_param = request.query_params.get("limit")
        cursor_param = request.query_params.get("cursor")
        cid_param = request.query_params.get("cid")

        limit = 50
        if limit_param:
            try:
                limit = max(1, min(100, int(limit_param)))
            except (TypeError, ValueError) as exc:
                raise ValidationError({"limit": "Invalid limit"}) from exc

        queryset = AuditTrail.objects.all().order_by("-ts", "-id")
        if cid_param:
            try:
                canonical = canonical_cid(cid_param)
            except ValueError as exc:
                raise ValidationError({"cid": "Invalid cid"}) from exc
            queryset = queryset.filter(cid=canonical)

        if cursor_param:
            try:
                cursor_id = int(cursor_param)
            except (TypeError, ValueError) as exc:
                raise ValidationError({"cursor": "Invalid cursor"}) from exc
            queryset = queryset.filter(id__lt=cursor_id)

        rows = list(queryset[: limit + 1])
        has_next = len(rows) > limit
        if has_next:
            rows = rows[:limit]
        next_cursor = str(rows[-1].id) if has_next and rows else None

        results = [
            {
                "ts": entry.ts.isoformat().replace("+00:00", "Z"),
                "user_id": entry.user_id,
                "cid": entry.cid,
                "action": entry.action,
                "target_id": entry.target_id,
                "request_id": entry.request_id,
                "meta": entry.meta or {},
            }
            for entry in rows
        ]

        return Response({"results": results, "next": next_cursor})


def _reset_room(room: Room) -> int:
    messages_qs = Message.objects.filter(rooms=room)
    deleted_messages = messages_qs.count()
    channel = Channel.objects.filter(uuid=room.uuid, client=room.client).first()

    with transaction.atomic():
        if channel:
            ReadState.objects.filter(channel=channel).delete()
        Draft.objects.filter(room=room).delete()
        messages_qs.delete()

    return deleted_messages


def _get_room_label(room: Room) -> str | None:
    data = room.data if isinstance(room.data, dict) else {}
    label = data.get("label") if isinstance(data, dict) else None
    if isinstance(label, str) and label.strip():
        return label

    name = data.get("name") if isinstance(data, dict) else None
    if isinstance(name, str) and name.strip():
        return name

    return None


def _slugify_label(label: str | None) -> str | None:
    if not isinstance(label, str):
        return None
    normalized = label.strip().lower()
    if not normalized:
        return None
    return re.sub(r"[^a-z0-9]+", "-", normalized)


def _get_room(cid: str) -> Room:
    cid_str = str(cid)
    if ":" in cid_str:
        _, room_uuid = cid_str.split(":", 1)
    else:
        room_uuid = cid_str
    room = Room.objects.filter(uuid=room_uuid).first()
    if not room:
        raise Http404("Room not found")
    return room


def _resolve_user_identifier(user) -> str:
    return getattr(user, "supabase_uid", None) or str(user.pk)
