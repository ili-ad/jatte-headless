"""Agent service orchestration for automated chat replies."""
from __future__ import annotations

import json
import logging
import time
import uuid
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal
from typing import Any, Sequence

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from chat.api_views import _broadcast_to_cid
from chat.models import Channel, Message, Room
from chat.serializers import MessageSerializer

from ..config import (
    AGENT_MAX_TOKENS,
    AGENT_MODEL,
    AGENT_TIMEOUT_SEC,
)
from ..models import AgentRoomPolicy, AgentRun
from ..registry import enabled_for_room
from ..services.llm_client import BudgetExceeded, LLMClient, LLMResult
from ..services.tooling import (
    ToolCall,
    build_tool_schemas,
    infer_args_from_text,
    parse_tool_instructions,
)
from ..skills import ConversationCtx, Skill
from ...common_audit.models import MessageProvenance
from ...notifications.models import AdminPresence
from ...notifications.services.notify import NotificationService
from ..utils import agent_user_id_for_room
from .metrics import estimate_prompt_tokens

logger = logging.getLogger(__name__)

ACTIVE_WINDOW_SEC = getattr(settings, "ACTIVE_WINDOW_SEC", 120)


@dataclass
class AgentReply:
    """Normalized agent reply payload."""

    text: str
    tokens_used: int
    latency_ms: int
    model: str
    cost_usd: Decimal
    reason: str = "ok"

    def __str__(self) -> str:  # pragma: no cover - convenience
        return self.text


@dataclass
class AgentOrchestrationResult:
    """Internal representation of an orchestration cycle."""

    request_id: str
    text: str
    status: str
    tools_used: list[str]
    latency_ms: int
    tokens_in: int
    tokens_out: int
    cost_usd: Decimal
    reason: str
    handoff_triggered: bool


@dataclass
class AgentSimulationResult:
    """Return payload for simulation endpoints."""

    reply: str
    status: str
    tools_used: list[str]
    latency_ms: int
    tokens_in: int
    tokens_out: int
    cost_usd: Decimal
    model: str


class AgentService:
    """Service responsible for producing agent replies via skill orchestration."""

    canned_text = "Thanks — an agent will follow up shortly."

    def __init__(self, *, llm_client: LLMClient | None = None) -> None:
        self.llm_client = llm_client or LLMClient()

    # ------------------------------------------------------------------
    # High level orchestration
    # ------------------------------------------------------------------
    def generate(
        self,
        cid: str,
        user_id: str | None = None,
        text: str | None = None,
        *,
        prompt: str | None = None,
        meta: dict[str, Any] | None = None,
        request_id: str | None = None,
    ) -> AgentReply:
        """Produce an agent reply and persist/broadcast it."""

        message_text = text if text is not None else (prompt or "")
        meta_payload = dict(meta or {})

        result = self._orchestrate(
            cid=cid,
            user_id=user_id,
            message_text=message_text,
            meta=meta_payload,
            request_id=request_id,
            persist=True,
            record_run=True,
        )

        reply = AgentReply(
            text=result.text,
            tokens_used=result.tokens_out,
            latency_ms=result.latency_ms,
            model=AGENT_MODEL,
            cost_usd=result.cost_usd,
            reason=result.status,
        )

        log_reason = result.reason if result.status == AgentRun.STATUS_ERROR else result.status

        logger.info(
            "agent.generate",
            extra={
                "request_id": result.request_id,
                "cid": cid,
                "user_id": user_id,
                "latency_ms": result.latency_ms,
                "tokens_used": result.tokens_out,
                "reason": log_reason,
                "status": result.status,
                "tools_used": result.tools_used,
            },
        )

        return reply

    def simulate(
        self,
        *,
        cid: str,
        prompt: str,
        meta: dict[str, Any] | None = None,
        user_id: str | None = None,
        request_id: str | None = None,
    ) -> AgentSimulationResult:
        """Execute the orchestration flow without persisting any messages."""

        meta_payload = dict(meta or {})
        message_text = prompt or ""

        result = self._orchestrate(
            cid=cid,
            user_id=user_id,
            message_text=message_text,
            meta=meta_payload,
            request_id=request_id,
            persist=False,
            record_run=False,
        )

        log_reason = result.reason if result.status == AgentRun.STATUS_ERROR else result.status

        logger.info(
            "agent.simulate",
            extra={
                "request_id": result.request_id,
                "cid": cid,
                "user_id": user_id,
                "latency_ms": result.latency_ms,
                "tokens_used": result.tokens_out,
                "reason": log_reason,
                "status": result.status,
                "tools_used": result.tools_used,
            },
        )

        return AgentSimulationResult(
            reply=result.text,
            status=result.status,
            tools_used=result.tools_used,
            latency_ms=result.latency_ms,
            tokens_in=result.tokens_in,
            tokens_out=result.tokens_out,
            cost_usd=result.cost_usd,
            model=AGENT_MODEL,
        )

    def _orchestrate(
        self,
        *,
        cid: str,
        user_id: str | None,
        message_text: str,
        meta: dict[str, Any],
        request_id: str | None,
        persist: bool,
        record_run: bool,
    ) -> AgentOrchestrationResult:
        effective_request_id = request_id or meta.get("request_id") or str(uuid.uuid4())
        start = time.perf_counter()
        run_status = AgentRun.STATUS_OK
        tools_used: list[str] = []
        tokens_out = 0
        total_cost = Decimal("0")
        reply_text = ""
        reason = "ok"
        handoff_triggered = False

        policy = self._get_policy(cid)
        tool_hop_cap = max(int(policy.tool_hop_cap), 0)
        turn_cap = max(int(policy.turn_cap), 1)
        handoff_message = policy.handoff_message or self.canned_text

        skills = enabled_for_room(cid)
        tool_schemas = build_tool_schemas(skills) if skills else []
        skill_lookup = {skill.name: skill for skill in skills}

        messages = self._compose_messages(message_text, meta=meta)
        ctx = self._conversation_ctx(cid=cid, user_id=user_id, meta=meta)

        tool_hops = 0
        turn = 0
        fallback_attempted = False

        try:
            if not policy.agent_enabled:
                reply_text = handoff_message
                run_status = AgentRun.STATUS_HANDOFF
                handoff_triggered = True
            else:
                while turn < turn_cap:
                    turn += 1
                    llm_result = self._call_llm(messages, tool_schemas, meta)
                    tokens_out += llm_result.tokens_used
                    total_cost += llm_result.cost_usd

                    tool_calls, potential_text = parse_tool_instructions(llm_result.content)

                    if tool_calls:
                        if tool_hop_cap == 0 or tool_hops >= tool_hop_cap:
                            run_status = AgentRun.STATUS_CAPPED
                            handoff_triggered = True
                            break
                        remaining = tool_hop_cap - tool_hops if tool_hop_cap else None
                        executed = self._execute_tool_calls(
                            tool_calls,
                            skill_lookup,
                            ctx,
                            messages,
                            limit=remaining,
                        )
                        if executed:
                            tools_used.extend(executed)
                            tool_hops += len(executed)
                        if tool_hops >= tool_hop_cap and turn < turn_cap:
                            run_status = AgentRun.STATUS_CAPPED
                            handoff_triggered = True
                            break
                        continue

                    if potential_text:
                        reply_text = potential_text
                        break

                    if not fallback_attempted and skills:
                        candidate = self._fallback_candidate(skills, message_text, ctx)
                        if candidate and tool_hops < tool_hop_cap:
                            executed = self._execute_fallback(candidate, message_text, ctx, messages)
                            if executed:
                                tools_used.append(candidate.name)
                                tool_hops += 1
                                fallback_attempted = True
                                continue
                        elif candidate and tool_hop_cap == 0:
                            run_status = AgentRun.STATUS_CAPPED
                            handoff_triggered = True
                            break

                    reply_text = potential_text or ""
                    break

                else:
                    run_status = AgentRun.STATUS_CAPPED
                    handoff_triggered = True

                if not reply_text.strip():
                    reply_text = handoff_message
                    if run_status != AgentRun.STATUS_CAPPED:
                        run_status = AgentRun.STATUS_HANDOFF
                    handoff_triggered = True

        except BudgetExceeded:
            reason = "budget_exceeded"
            reply_text = handoff_message
            run_status = AgentRun.STATUS_ERROR
            handoff_triggered = True
        except TimeoutError:
            reason = "timeout"
            reply_text = handoff_message
            run_status = AgentRun.STATUS_ERROR
            handoff_triggered = True
        except Exception:  # pragma: no cover - defensive log
            reason = "error"
            reply_text = handoff_message
            run_status = AgentRun.STATUS_ERROR
            handoff_triggered = True
            logger.exception("agent.generate.failure", extra={"cid": cid})

        latency_ms = int((time.perf_counter() - start) * 1000)
        tokens_in = estimate_prompt_tokens(message_text, history=meta.get("history"))

        if persist:
            message = self._persist_reply(cid=cid, text=reply_text, handoff=handoff_triggered)
            self._mark_provenance(message)
            if handoff_triggered:
                self._notify_handoff(cid)

        if record_run:
            self._record_run(
                run_id=effective_request_id,
                cid=cid,
                user_id=user_id,
                tools_used=tools_used,
                status=run_status,
                latency_ms=latency_ms,
                tokens_in=tokens_in,
                tokens_out=tokens_out,
                cost=total_cost,
            )

        return AgentOrchestrationResult(
            request_id=effective_request_id,
            text=reply_text,
            status=run_status,
            tools_used=tools_used,
            latency_ms=latency_ms,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost_usd=total_cost,
            reason=reason,
            handoff_triggered=handoff_triggered,
        )

    # ------------------------------------------------------------------
    # Helper methods
    # ------------------------------------------------------------------
    def _get_policy(self, cid: str) -> AgentRoomPolicy:
        policy = AgentRoomPolicy.objects.filter(cid=cid).first()
        if not policy:
            policy = AgentRoomPolicy.objects.create(cid=cid)
        return policy

    def _conversation_ctx(
        self,
        *,
        cid: str,
        user_id: str | None,
        meta: dict[str, Any] | None,
    ) -> ConversationCtx:
        return {
            "cid": cid,
            "user_id": user_id or "",
            "now": timezone.now(),
            "metadata": dict(meta or {}),
        }

    def _compose_messages(
        self,
        user_text: str,
        *,
        meta: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        messages: list[dict[str, Any]] = []
        history = (meta or {}).get("history")
        if isinstance(history, list):
            for message in history:
                if isinstance(message, dict) and {"role", "content"}.issubset(message):
                    messages.append(
                        {"role": message["role"], "content": str(message["content"])}
                    )
        messages.append({"role": "user", "content": user_text})
        return messages

    def _call_llm(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        meta: dict[str, Any] | None,
    ) -> LLMResult:
        timeout = (meta or {}).get("timeout")
        return self.llm_client.run(
            messages,
            tools=tools or None,
            model=AGENT_MODEL,
            max_tokens=AGENT_MAX_TOKENS,
            timeout=timeout or AGENT_TIMEOUT_SEC,
        )

    def _execute_tool_calls(
        self,
        calls: Sequence[ToolCall],
        skill_lookup: dict[str, Skill],
        ctx: ConversationCtx,
        messages: list[dict[str, Any]],
        *,
        limit: int | None,
    ) -> list[str]:
        executed: list[str] = []
        remaining = limit if limit is None else max(limit, 0)
        for call in calls:
            if remaining is not None and remaining <= 0:
                break
            skill = skill_lookup.get(call.name)
            if not skill:
                logger.warning("agent.tool.unknown", extra={"tool": call.name})
                continue
            try:
                payload = skill.execute(call.arguments, ctx)
            except Exception:  # pragma: no cover - defensive
                logger.exception("agent.tool.failure", extra={"tool": call.name})
                continue
            executed.append(skill.name)
            if remaining is not None:
                remaining -= 1
            messages.append(
                {
                    "role": "tool",
                    "name": skill.name,
                    "content": self._serialize_json(payload),
                }
            )
        return executed

    def _fallback_candidate(
        self,
        skills: Sequence[Skill],
        text: str,
        ctx: ConversationCtx,
    ) -> Skill | None:
        candidates = [skill for skill in skills if skill.can_handle(text, ctx)]
        if len(candidates) == 1:
            return candidates[0]
        return None

    def _execute_fallback(
        self,
        skill: Skill,
        text: str,
        ctx: ConversationCtx,
        messages: list[dict[str, Any]],
    ) -> bool:
        args = infer_args_from_text(skill, text)
        if not args and text:
            args = {"text": text}
        try:
            payload = skill.execute(args, ctx)
        except Exception:  # pragma: no cover - defensive
            logger.exception("agent.fallback.failure", extra={"tool": skill.name})
            return False
        messages.append(
            {
                "role": "tool",
                "name": skill.name,
                "content": self._serialize_json(payload),
            }
        )
        return True

    def _serialize_json(self, payload: Any) -> str:
        try:
            return json.dumps(payload, default=str)
        except TypeError:  # pragma: no cover - defensive
            return json.dumps({"result": str(payload)})

    def _persist_reply(self, *, cid: str, text: str, handoff: bool) -> Message:
        serializer = MessageSerializer(
            data={"text": text, "custom_data": {"agent": {"handoff": handoff}}}
        )
        serializer.is_valid(raise_exception=True)

        room_uuid = cid.split(":", 1)[1] if ":" in cid else cid
        agent_user = agent_user_id_for_room(room_uuid)

        with transaction.atomic():
            channel, _ = Channel.objects.select_for_update().get_or_create(
                uuid=room_uuid,
                defaults={"client": "stream"},
            )
            room, _ = Room.objects.select_for_update().get_or_create(
                uuid=room_uuid,
                defaults={"client": "stream"},
            )
            serializer.save(channel=channel, sent_by=agent_user)
            room.messages.add(serializer.instance)

        payload = MessageSerializer(serializer.instance).data
        payload["user_id"] = agent_user
        payload["user"] = {"id": agent_user, "name": "Assistant"}
        _broadcast_to_cid(cid, {"type": "message.new", "message": payload})
        return serializer.instance

    def _mark_provenance(self, message) -> None:
        MessageProvenance.objects.get_or_create(
            message=message,
            defaults={"source": MessageProvenance.Source.AGENT},
        )

    def _notify_handoff(self, cid: str) -> None:
        now = timezone.now()
        cutoff = now - timedelta(seconds=ACTIVE_WINDOW_SEC)
        has_active_admin = AdminPresence.objects.filter(last_seen_at__gte=cutoff).exists()

        UserModel = get_user_model()
        staff = list(
            UserModel.objects.filter(Q(is_staff=True) | Q(is_superuser=True)).distinct()
        )
        if staff:
            notice_text = json.dumps({"type": "agent.handoff", "cid": cid})
            NotificationService().create_notification_item(text=notice_text, users=staff)

        if not has_active_admin:
            logger.info("agent.handoff.escalate", extra={"cid": cid})

    def _record_run(
        self,
        *,
        run_id: str,
        cid: str,
        user_id: str | None,
        tools_used: Sequence[str],
        status: str,
        latency_ms: int,
        tokens_in: int,
        tokens_out: int,
        cost: Decimal,
    ) -> None:
        AgentRun.objects.update_or_create(
            run_id=run_id,
            defaults={
                "cid": cid,
                "user_id": user_id or "",
                "tools_used": list(tools_used),
                "status": status,
                "latency_ms": latency_ms,
                "tokens_in": max(tokens_in, 0),
                "tokens_out": tokens_out,
                "cost_usd": cost,
            },
        )


_service_override: AgentService | None = None
_default_service: AgentService | None = None


def get_agent_service() -> AgentService:
    """Return the configured agent service instance."""

    if _service_override is not None:
        return _service_override

    global _default_service
    if _default_service is None:
        _default_service = AgentService()
    return _default_service


def set_agent_service(service: AgentService | None) -> None:
    """Override the global service instance (primarily for tests)."""

    global _service_override
    _service_override = service
