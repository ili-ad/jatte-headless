"""Agent service orchestration for automated chat replies."""
from __future__ import annotations

import json
import logging
import os
import time
import threading
import uuid
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal
from typing import Any, Callable, Iterable, List, Sequence

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import close_old_connections
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from stream_server_django.chat.api_views import _broadcast_to_cid
from stream_server_django.chat.consumers import broadcast_message_update
from stream_server_django.chat.models import Channel, Message, Room
from stream_server_django.chat.serializers import MessageSerializer
from stream_server_django.chat.utils import canonical_cid

from .sidecar_catalog import SidecarItemDef
from ..extensions import build_rag_system_prompt, get_sidecar_defs
from ..sidecar_metadata import extract_sidecar_metadata
from .vector_memory import embed_query, search_similar
from .metrics import estimate_prompt_tokens

from ..config import (
    AGENT_MAX_TOKENS,
    AGENT_MODEL,
    AGENT_RAG_STATE_DEFAULT,
    AGENT_RAG_TOPIC_DEFAULT,
    AGENT_STREAMING_TIMEOUT_SEC,
    AGENT_TIMEOUT_SEC,
)
from ..models import AgentRoomPolicy, AgentRun
from ..registry import enabled_for_room
from ..services.llm_client import BudgetExceeded, LLMClient, LLMResult
from ..services.tooling import (
    ToolCall,
    build_tool_schemas,
    ensure_tool_call_id,
    infer_args_from_text,
    parse_tool_instructions,
    preview_tool_args,
)
from ..skills import ConversationCtx, Skill
from ...common_audit.models import MessageProvenance
from ...notifications.models import AdminPresence
from ...notifications.services.notify import NotificationService
from ..utils import agent_user_id_for_room


logger = logging.getLogger("agent")
AGENT_STREAMING_DEBUG = bool(
    getattr(settings, "AGENT_STREAMING_DEBUG", False)
    or os.environ.get("AGENT_STREAMING_DEBUG")
)

ACTIVE_WINDOW_SEC = getattr(settings, "ACTIVE_WINDOW_SEC", 120)


class HandoffReason:
    CAPPED = "CAPPED"
    TOOL_EXCEPTION = "TOOL_EXCEPTION"
    TOOL_EMPTY_RESULT = "TOOL_EMPTY_RESULT"
    NO_TOOLS_ENABLED = "NO_TOOLS_ENABLED"
    TOOL_CALL_PROTOCOL_ERROR = "TOOL_CALL_PROTOCOL_ERROR"
    LLM_ERROR = "LLM_ERROR"
    TIMEOUT = "TIMEOUT"
    BUDGET_EXCEEDED = "BUDGET_EXCEEDED"
    UNKNOWN = "UNKNOWN"


class CancelledError(Exception):
    """Raised when an in-flight agent run has been cancelled."""


class ToolCallProtocolError(Exception):
    """Raised when tool call sequencing breaks expected protocol."""


def mark_agent_state(
    *,
    room: Room,
    ai_state: str,
    ai_message: Message | None = None,
    agent_run: AgentRun | None = None,
    error_reason: str | None = None,
) -> None:
    """
    Canonical place to keep AI message metadata, room busy flags, and run status in sync.
    """

    room_update_fields: list[str] = []
    agent_run_update_fields: list[str] = []

    if ai_state in ("AI_STATE_THINKING", "AI_STATE_GENERATING"):
        desired_busy = True
        desired_run_id = agent_run.run_id if agent_run is not None else room.active_agent_run_id
    else:
        desired_busy = False
        desired_run_id = None

    if room.agent_busy != desired_busy:
        room.agent_busy = desired_busy
        room_update_fields.append("agent_busy")
    if room.active_agent_run_id != desired_run_id:
        room.active_agent_run_id = desired_run_id
        room_update_fields.append("active_agent_run_id")
    if room_update_fields:
        room.save(update_fields=room_update_fields)

    if agent_run is not None:
        if ai_state in ("AI_STATE_THINKING", "AI_STATE_GENERATING"):
            if agent_run.status != AgentRun.STATUS_RUNNING:
                agent_run.status = AgentRun.STATUS_RUNNING
                agent_run_update_fields.append("status")
        elif ai_state == "AI_STATE_ERROR" and error_reason == "cancelled":
            if agent_run.status != AgentRun.STATUS_CANCELLED:
                agent_run.status = AgentRun.STATUS_CANCELLED
                agent_run_update_fields.append("status")
        if agent_run_update_fields:
            agent_run.updated_at = timezone.now()
            agent_run_update_fields.append("updated_at")
            agent_run.save(update_fields=agent_run_update_fields)

    if ai_message is not None:
        custom_data = dict(ai_message.custom_data or {})
        custom_data["ai_state"] = ai_state
        if error_reason is not None:
            custom_data["error_reason"] = error_reason

        ai_message.custom_data = custom_data
        ai_message.updated_at = timezone.now()
        ai_message.save(update_fields=["custom_data", "updated_at"])

        if not os.environ.get("DISABLE_AGENT_BROADCAST"):
            try:
                broadcast_message_update(ai_message)
            except RuntimeError:
                logger.debug(
                    "agent.state.broadcast_skipped",
                    extra={"message_id": getattr(ai_message, "id", None)},
                )
            except Exception:
                logger.exception(
                    "agent.state.broadcast_failed",
                    extra={"message_id": getattr(ai_message, "id", None)},
                )

    cid = getattr(room, "cid", None) or canonical_cid(None, room_uuid=room.uuid)

    ai_indicator_payload: dict[str, Any] = {
        "type": "ai_indicator.update",
        "cid": cid,
        "ai_state": ai_state,
    }

    if agent_run is not None:
        ai_indicator_payload["run_id"] = agent_run.run_id

    if ai_message is not None:
        ai_indicator_payload["message_id"] = str(ai_message.id)

    if error_reason is not None:
        ai_indicator_payload["error_reason"] = error_reason

    if not os.environ.get("DISABLE_AGENT_BROADCAST"):
        try:
            _broadcast_to_cid(cid, ai_indicator_payload)
        except RuntimeError:
            logger.debug(
                "agent.ai_indicator.broadcast_skipped", extra={"cid": cid}
            )
        except Exception:
            logger.exception(
                "agent.ai_indicator.broadcast_failed", extra={"cid": cid}
            )


def _build_sidecar_prompt_block(items: Iterable[SidecarItemDef]) -> str:
    """
    Build the sidecar section appended to the RAG system prompt.

    This is generic and can describe forms, pages, or other interactive
    resources. It does NOT change any of the existing RAG behavior.
    """
    items_list: List[SidecarItemDef] = list(items)
    if not items_list:
        # If no sidecar items are configured yet, we don't add any extra instructions.
        return ""

    # Describe the available items in a compact, model-friendly way.
    lines: List[str] = []
    lines.append("Additional interactive sidecar resources are available.")
    lines.append("These can be forms, pages, or other tools the user may want to open next.")
    lines.append("Available sidecar items:")
    for item in items_list:
        kind = item.kind or "item"
        # Example line:
        # - ITEM_ID (form): Example Form – Short description...
        lines.append(
            f"- {item.id} ({kind}): {item.label} – {item.blurb}"
        )

    lines.append("")
    lines.append(
        "After you finish your natural-language answer, decide whether one or more "
        "of these sidecar items would help the user take the next step."
    )
    lines.append("Then output a FINAL machine-readable line on its own:")
    lines.append(
        'SIDECAR_JSON: [{"id": "ITEM_ID", "reason": "To take the next step"}, ...]'
    )
    lines.append("- Use only sidecar item ids from the list above.")
    lines.append("- Suggest at most 3 items.")
    lines.append("- If no sidecar item is appropriate, output: SIDECAR_JSON: [].")
    lines.append("- Do NOT explain this line; just emit it exactly in that format.")

    return "\n".join(lines)


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
    message: Message | None = None


@dataclass
class AgentReply:
    """Normalized agent reply payload."""

    text: str
    tokens_used: int
    latency_ms: int
    model: str
    cost_usd: Decimal
    reason: str = "ok"
    messages: list[Message] | None = None


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

    canned_text = "Let me connect you with a teammate."
    streaming_timeout_text = (
        "I had to stop because I hit the 60-second budget. If you'd like, "
        "try resubmitting with a shorter prompt."
    )

    def __init__(self, *, llm_client: LLMClient | None = None) -> None:
        self.llm_client = llm_client or LLMClient()
        logger.info(
            "agent.llm.config",
            extra={
                "provider": self.llm_client.provider.__class__.__name__,
                "model": self.llm_client.default_model,
                "timeout_sec": self.llm_client.default_streaming_timeout,
                "max_tokens": self.llm_client.default_max_tokens,
            },
        )

    def _get_room_for_cid(self, cid: str) -> Room | None:
        room_uuid = cid.split(":", 1)[1] if ":" in cid else cid
        room, _ = Room.objects.get_or_create(
            uuid=room_uuid, defaults={"client": "stream"}
        )
        return room

    def _start_agent_run(
        self, *, room: Room, cid: str, run_id: str, user_id: str | None
    ) -> AgentRun:
        agent_run, _ = AgentRun.objects.update_or_create(
            run_id=run_id,
            defaults={
                "cid": cid,
                "user_id": user_id or "",
                "tools_used": [],
                "status": AgentRun.STATUS_RUNNING,
                "latency_ms": 0,
                "tokens_in": 0,
                "tokens_out": 0,
                "handoff": False,
                "handoff_reason": "",
                "handoff_detail": "",
                "last_tool_name": "",
                "last_tool_call_id": "",
                "last_tool_args_preview": "",
            },
        )

        mark_agent_state(
            room=room,
            ai_state="AI_STATE_THINKING",
            agent_run=agent_run,
        )

        return agent_run

    def _is_run_cancelled(self, run_id: str | None) -> bool:
        if not run_id:
            return False
        return AgentRun.objects.filter(
            run_id=run_id, status=AgentRun.STATUS_CANCELLED
        ).exists()

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
            messages=[result.message] if result.message else None,
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

    def enqueue_generate(
        self,
        *,
        cid: str,
        user_id: str | None = None,
        text: str | None = None,
        meta: dict[str, Any] | None = None,
        request_id: str | None = None,
    ) -> str:
        """Fire-and-forget scheduling of :py:meth:`generate` in a background thread."""

        job_id = str(uuid.uuid4())
        meta_payload = dict(meta or {})
        meta_payload.setdefault("cid", cid)
        meta_payload["job_id"] = job_id

        logger.info(
            "agent.generate.job.enqueued",
            extra={"cid": cid, "job_id": job_id, "trace_id": request_id},
        )

        thread = threading.Thread(
            target=self._run_generate_job,
            kwargs={
                "job_id": job_id,
                "cid": cid,
                "user_id": user_id,
                "text": text,
                "meta": meta_payload,
                "request_id": request_id,
            },
            daemon=True,
        )
        thread.start()

        return job_id

    def _run_generate_job(
        self,
        *,
        job_id: str,
        cid: str,
        user_id: str | None,
        text: str | None,
        meta: dict[str, Any],
        request_id: str | None,
    ) -> None:
        close_old_connections()
        job_status = "ok"
        job_reason = "ok"
        start = time.perf_counter()

        logger.info(
            "agent.generate.job.start",
            extra={"cid": cid, "job_id": job_id, "trace_id": request_id},
        )

        try:
            reply = self.generate(
                cid=cid,
                user_id=user_id,
                text=text,
                meta=meta,
                request_id=request_id,
            )
            job_reason = reply.reason
            self._finalize_generated_messages(reply, meta)
        except CancelledError:
            job_status = AgentRun.STATUS_CANCELLED
            job_reason = "cancelled"
            logger.info(
                "agent.generate.job.cancelled",
                extra={"cid": cid, "job_id": job_id, "trace_id": request_id},
            )
        except Exception:
            job_status = "error"
            job_reason = "exception"
            logger.exception(
                "agent.generate.job.failure",
                extra={"cid": cid, "job_id": job_id, "trace_id": request_id},
            )
        finally:
            logger.info(
                "agent.generate.job.complete",
                extra={
                    "cid": cid,
                    "job_id": job_id,
                    "trace_id": request_id,
                    "status": job_status,
                    "reason": job_reason,
                    "latency_ms": int((time.perf_counter() - start) * 1000),
                },
            )
            close_old_connections()

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
        handoff_reason: str | None = None
        handoff_detail: str | None = None
        last_tool_name: str | None = None
        last_tool_call_id: str | None = None
        last_tool_args_preview: str | None = None
        agent_run: AgentRun | None = None

        room = self._get_room_for_cid(cid)
        room_uuid = getattr(room, "uuid", None)

        policy = self._get_policy(cid)
        tool_hop_cap = max(int(policy.tool_hop_cap), 0)
        turn_cap = max(int(policy.turn_cap), 1)
        handoff_message = policy.handoff_message or self.canned_text

        skills = enabled_for_room(cid)

        cap_reached = tool_hop_cap == 0
        tool_schemas = build_tool_schemas(skills) if skills else []
        if cap_reached:
            tool_schemas = []

        if not skills:
            _note_handoff(HandoffReason.NO_TOOLS_ENABLED, "no tools enabled")

        # Allow lookup by skill name and any tool alias attached by the schema builder.
        skill_lookup = {skill.name: skill for skill in skills}
        for skill in skills:
            tool_name = getattr(skill, "_tool_name", None)
            if isinstance(tool_name, str) and tool_name and tool_name not in skill_lookup:
                skill_lookup[tool_name] = skill

        def _note_handoff(reason_code: str, detail: str | None = None) -> None:
            nonlocal handoff_reason, handoff_detail
            if handoff_reason in (None, HandoffReason.UNKNOWN):
                handoff_reason = reason_code
            if detail:
                handoff_detail = detail

        def _remember_tool_attempt(call: ToolCall, skill: Skill | None) -> None:
            nonlocal last_tool_name, last_tool_call_id, last_tool_args_preview
            tool_label = getattr(skill, "name", None) or call.name
            last_tool_name = tool_label
            last_tool_call_id = call.id
            last_tool_args_preview = preview_tool_args(call.arguments)

        def _note_tool_exception(call: ToolCall, skill: Skill | None, exc: Exception) -> None:
            _remember_tool_attempt(call, skill)
            _note_handoff(
                HandoffReason.TOOL_EXCEPTION,
                detail=f"{exc.__class__.__name__}: {exc}",
            )


        tool_hops = 0
        turn = 0
        fallback_attempted = False
        routing_mode = "llm_router"
        pre_router_candidate_count = 0
        pre_routed_skill: Skill | None = None
        pre_router_tool_name: str | None = None

        # Optional RAG enrichment: only when requested via meta["use_rag"]
        meta_payload = dict(meta or {})
        rag_enabled = bool(meta_payload.get("use_rag"))
        rag_used = False
        rag_k = 0
        top_score = None
        top_ids: list[Any] = []
        meta_payload.setdefault("cid", cid)
        llm_timeout = (
            meta_payload.get("timeout")
            or getattr(self.llm_client, "default_timeout", None)
            or AGENT_TIMEOUT_SEC
        )
        state = meta_payload.get("state") or AGENT_RAG_STATE_DEFAULT
        topic = meta_payload.get("rag_topic") or AGENT_RAG_TOPIC_DEFAULT

        sidecar_defs = get_sidecar_defs(meta_payload)
        if state:
            state_upper = state.upper()
            sidecar_defs = [
                item
                for item in sidecar_defs
                if not item.state or item.state.upper() == state_upper
            ]

        if rag_enabled:
            if state:
                try:
                    query_emb = embed_query(message_text)
                    chunks = search_similar(
                        state=state,
                        query_embedding=query_emb,
                        k=int(meta_payload.get("rag_k", 5)),
                        topic=topic,
                    )
                except Exception:
                    # If RAG fails, we fall back silently to non-RAG behavior.
                    chunks = []
            else:
                chunks = []

            rag_used = bool(chunks)
            rag_k = len(chunks)
            raw_top_score = None
            if chunks:
                raw_top_score = getattr(chunks[0], "score", None)
                if raw_top_score is None:
                    raw_top_score = getattr(chunks[0], "distance", None)
                if raw_top_score is None:
                    raw_top_score = getattr(chunks[0], "similarity", None)
                top_ids = [getattr(c, "id", None) for c in chunks[:3]]

            try:
                top_score = float(raw_top_score) if raw_top_score is not None else None
            except (TypeError, ValueError):
                top_score = None

            logger.info(
                "agent.rag.result cid=%s trace_id=%s state=%s topic=%s used=%s k=%s top_score=%s top_ids=%s",
                cid,
                request_id,
                state,
                topic,
                rag_used,
                rag_k,
                top_score,
                top_ids,
            )

            if chunks:
                context_pieces: list[str] = []
                for chunk in chunks:
                    if chunk.heading:
                        context_pieces.append(f"## {chunk.heading}\n{chunk.text}")
                    else:
                        context_pieces.append(chunk.text)

                context_block = "\n\n---\n\n".join(context_pieces)

                rag_system = build_rag_system_prompt(
                    question=message_text,
                    context_block=context_block,
                    meta=meta_payload,
                    state=state,
                    topic=topic,
                )

                sidecar_block = _build_sidecar_prompt_block(sidecar_defs)
                if sidecar_block:
                    rag_system = rag_system + "\n\n" + sidecar_block + "\n"

                meta_payload["rag_context"] = rag_system
                meta_payload["rag_chunk_ids"] = [c.id for c in chunks]

                # after building rag_system and rag_chunk_ids
                logger.info(
                    "agent.rag.context",
                    extra={
                        "cid": cid,
                        "rag_enabled": rag_enabled,
                        "state": state,
                        "topic": topic,
                        "rag_chunk_ids": [c.id for c in chunks],
                    },
                )

        if not rag_enabled:
            logger.info("agent.rag.disabled", extra={"cid": cid})
        elif not meta_payload.get("rag_context"):
            logger.info(
                "agent.rag.no_chunks",
                extra={"cid": cid, "state": state, "topic": topic},
            )

        # From here on, use meta_payload instead of the original `meta`
        meta = meta_payload

        # Now that meta may contain rag_context, compose messages and ctx
        messages = self._compose_messages(message_text, meta=meta)
        ctx = self._conversation_ctx(cid=cid, user_id=user_id, meta=meta)

        if skills and tool_hop_cap > 0:
            pre_routed_skill, pre_router_candidate_count = self._select_pre_routed_skill(
                skills,
                message_text,
                ctx,
            )
            if pre_routed_skill:
                pre_router_tool_name = self._select_pre_routed_tool_name(
                    pre_routed_skill,
                    tool_schemas,
                    skill_lookup,
                )
                if pre_router_tool_name:
                    routing_mode = "pre_router"
                else:
                    pre_routed_skill = None


        ai_message: Message | None = None

        if persist and policy.agent_enabled:
            if room is not None:
                agent_run = self._start_agent_run(
                    room=room,
                    cid=cid,
                    run_id=effective_request_id,
                    user_id=user_id,
                )
            ai_message = self._persist_message(
                cid=cid,
                text="",
                custom_data={
                    "ai_generated": True,
                    "ai_state": "AI_STATE_THINKING",
                },
            )
            if room is not None:
                mark_agent_state(
                    room=room,
                    ai_state="AI_STATE_THINKING",
                    ai_message=ai_message,
                    agent_run=agent_run,
                )

        try:
            if not policy.agent_enabled:
                reply_text = handoff_message
                run_status = AgentRun.STATUS_HANDOFF
                handoff_triggered = True
                _note_handoff(
                    HandoffReason.NO_TOOLS_ENABLED,
                    "agent disabled for room",
                )
            else:
                if pre_routed_skill and pre_router_tool_name:
                    args = infer_args_from_text(pre_routed_skill, message_text)
                    if not args and message_text:
                        args = {"text": message_text}
                    executed = self._execute_tool_calls(
                        [ToolCall(name=pre_router_tool_name, arguments=args)],
                        skill_lookup,
                        ctx,
                        messages,
                        limit=1,
                        on_before_execute=_remember_tool_attempt,
                        on_exception=_note_tool_exception,
                    )
                    if executed:
                        tools_used.extend(executed)
                        tool_hops += len(executed)
                    if tool_hops >= tool_hop_cap:
                        cap_reached = True
                        tool_schemas = []

                    llm_start = time.perf_counter()
                    logger.info(
                        "agent.orchestrate.llm.start",
                        extra={
                            "cid": cid,
                            "turn": 1,
                            "timeout_sec": llm_timeout,
                            "routing_mode": routing_mode,
                        },
                    )
                    llm_outcome = "ok"
                    try:
                        llm_result = self._call_llm_streaming(
                            messages,
                            [],
                            meta,
                            stream_target=ai_message,
                            handoff_message=handoff_message,
                            room=room,
                            run_id=effective_request_id,
                        )
                    except Exception as exc:  # pragma: no cover - defensive log
                        llm_outcome = exc.__class__.__name__
                        raise
                    finally:
                        logger.info(
                            "agent.orchestrate.llm.complete",
                            extra={
                                "cid": cid,
                                "turn": 1,
                                "timeout_sec": llm_timeout,
                                "latency_ms": int(
                                    (time.perf_counter() - llm_start) * 1000
                                ),
                                "outcome": llm_outcome,
                                "routing_mode": routing_mode,
                            },
                        )

                    tokens_out += llm_result.tokens_used
                    total_cost += llm_result.cost_usd

                    if getattr(llm_result, "reason", "ok") != "ok":
                        reason = llm_result.reason
                        run_status = AgentRun.STATUS_ERROR
                        handoff_triggered = True
                        reply_text = llm_result.content
                        if llm_result.reason == "timeout":
                            _note_handoff(HandoffReason.TIMEOUT, "llm timeout")
                        elif llm_result.reason == "budget_exceeded":
                            _note_handoff(
                                HandoffReason.BUDGET_EXCEEDED,
                                "budget exceeded",
                            )
                        else:
                            _note_handoff(
                                HandoffReason.LLM_ERROR,
                                detail=llm_result.reason,
                            )
                    else:
                        reply_text = llm_result.content
                else:
                    while turn < turn_cap:
                        turn += 1
                        llm_start = time.perf_counter()
                        logger.info(
                            "agent.orchestrate.llm.start",
                            extra={
                                "cid": cid,
                                "turn": turn,
                                "timeout_sec": llm_timeout,
                            },
                        )
                        llm_outcome = "ok"
                        try:
                            llm_result = self._call_llm_streaming(
                                messages,
                                tool_schemas,
                                meta,
                                stream_target=ai_message,
                                handoff_message=handoff_message,
                                room=room,
                                run_id=effective_request_id,
                            )
                        except Exception as exc:  # pragma: no cover - defensive log
                            llm_outcome = exc.__class__.__name__
                            raise
                        finally:
                            logger.info(
                                "agent.orchestrate.llm.complete",
                                extra={
                                    "cid": cid,
                                    "turn": turn,
                                    "timeout_sec": llm_timeout,
                                    "latency_ms": int(
                                        (time.perf_counter() - llm_start) * 1000
                                    ),
                                    "outcome": llm_outcome,
                                },
                            )
                        tokens_out += llm_result.tokens_used
                        total_cost += llm_result.cost_usd

                        if getattr(llm_result, "reason", "ok") != "ok":
                            reason = llm_result.reason
                            run_status = AgentRun.STATUS_ERROR
                            handoff_triggered = True
                            reply_text = llm_result.content
                            if llm_result.reason == "timeout":
                                _note_handoff(HandoffReason.TIMEOUT, "llm timeout")
                            elif llm_result.reason == "budget_exceeded":
                                _note_handoff(HandoffReason.BUDGET_EXCEEDED, "budget exceeded")
                            else:
                                _note_handoff(
                                    HandoffReason.LLM_ERROR,
                                    detail=llm_result.reason,
                                )
                            break

                        tool_calls = list(getattr(llm_result, "tool_calls", []) or [])
                        potential_text = llm_result.content

                        if not tool_calls:
                            fallback_calls, potential_text = parse_tool_instructions(
                                llm_result.content
                            )
                            if fallback_calls:
                                tool_calls = fallback_calls

                        tools_enabled = tool_hops < tool_hop_cap if tool_hop_cap else False
                        if tool_calls:
                            if not tools_enabled:
                                cap_reached = True
                                tool_schemas = []
                                if potential_text:
                                    reply_text = potential_text
                                    break
                                continue
                            remaining = tool_hop_cap - tool_hops if tool_hop_cap else None
                            executed = self._execute_tool_calls(
                                tool_calls,
                                skill_lookup,
                                ctx,
                                messages,
                                limit=remaining,
                                on_before_execute=_remember_tool_attempt,
                                on_exception=_note_tool_exception,
                            )
                            if executed:
                                tools_used.extend(executed)
                                tool_hops += len(executed)
                            if tool_hops >= tool_hop_cap:
                                cap_reached = True
                                tool_schemas = []
                            continue

                        if potential_text:
                            reply_text = potential_text
                            break

                        if not fallback_attempted and skills and tools_enabled:
                            candidate = self._fallback_candidate(skills, message_text, ctx)
                            if candidate and tool_hops < tool_hop_cap:
                                executed = self._execute_fallback(candidate, message_text, ctx, messages)
                                if executed:
                                    tools_used.append(candidate.name)
                                    tool_hops += 1
                                    fallback_attempted = True
                                    continue
                            elif candidate and tool_hop_cap == 0:
                                cap_reached = True
                                tool_schemas = []

                        reply_text = potential_text or ""
                        break

                    else:
                        run_status = AgentRun.STATUS_CAPPED
                        handoff_triggered = True
                        _note_handoff(
                            HandoffReason.CAPPED,
                            "turn cap reached",
                        )

                if not reply_text.strip():
                    reply_text = handoff_message
                    if run_status != AgentRun.STATUS_CAPPED:
                        run_status = AgentRun.STATUS_HANDOFF
                    handoff_triggered = True
                    if handoff_reason is None:
                        _note_handoff(HandoffReason.UNKNOWN, "empty reply")

        except CancelledError:
            reason = "cancelled"
            run_status = AgentRun.STATUS_CANCELLED
            if ai_message is not None:
                reply_text = ai_message.body or reply_text
        except ToolCallProtocolError as exc:
            reason = "protocol_error"
            reply_text = handoff_message
            run_status = AgentRun.STATUS_ERROR
            handoff_triggered = True
            _note_handoff(HandoffReason.TOOL_CALL_PROTOCOL_ERROR, str(exc))
        except BudgetExceeded as exc:
            reason = "budget_exceeded"
            reply_text = handoff_message
            run_status = AgentRun.STATUS_ERROR
            handoff_triggered = True
            _note_handoff(HandoffReason.BUDGET_EXCEEDED, str(exc))
        except TimeoutError:
            reason = "timeout"
            reply_text = self.streaming_timeout_text
            run_status = AgentRun.STATUS_ERROR
            handoff_triggered = True
            _note_handoff(HandoffReason.TIMEOUT, "stream timeout")
        except Exception as exc:  # pragma: no cover - defensive log
            reason = "error"
            reply_text = handoff_message
            run_status = AgentRun.STATUS_ERROR
            handoff_triggered = True
            _note_handoff(HandoffReason.UNKNOWN, str(exc))
            logger.exception("agent.generate.failure", extra={"cid": cid})

        if handoff_triggered and handoff_reason is None:
            _note_handoff(HandoffReason.UNKNOWN, reason if reason != "ok" else None)

        # NEW: strip SIDECAR_JSON and collect sidecar suggestions
        allowed_ids = {item.id for item in sidecar_defs}
        clean_reply_text, sidecar_items = extract_sidecar_metadata(
            reply_text,
            allowed_ids=allowed_ids,
        )
        if sidecar_items:
            def_by_id = {item.id: item for item in sidecar_defs}
            enriched_items: list[dict[str, str]] = []
            for suggestion in sidecar_items:
                item_id = suggestion.get("id")
                if not item_id:
                    continue
                definition = def_by_id.get(str(item_id))
                if not definition:
                    continue
                enriched_items.append(
                    {
                        "id": str(item_id),
                        "reason": str(suggestion.get("reason") or ""),
                        "kind": definition.kind,
                        "label": definition.label,
                        "shortLabel": definition.short_label,
                        "slug": definition.slug,
                        "blurb": definition.blurb,
                    }
                )
            sidecar_items = enriched_items
        sidecar_actions = meta.get("sidecar_actions")
        reply_text = clean_reply_text

        latency_ms = int((time.perf_counter() - start) * 1000)
        tokens_in = estimate_prompt_tokens(message_text, history=meta.get("history"))

        if persist:
            if ai_message is not None:
                final_state = "AI_STATE_IDLE"
                custom_data = {**(ai_message.custom_data or {})}
                if run_status == AgentRun.STATUS_ERROR and reason != "timeout":
                    final_state = "AI_STATE_ERROR"
                if run_status == AgentRun.STATUS_CANCELLED:
                    final_state = "AI_STATE_ERROR"
                error_reason = None
                if reason == "timeout":
                    error_reason = "timeout"
                elif run_status == AgentRun.STATUS_CANCELLED:
                    error_reason = "cancelled"
                if rag_enabled:
                    custom_data.setdefault("rag", {})
                    custom_data["rag"].update({"used": rag_used, "k": rag_k})

                # NEW: attach sidecar suggestions, if any
                if sidecar_items:
                    custom_data["sidecar_items"] = sidecar_items
                if sidecar_actions:
                    custom_data["sidecar_actions"] = sidecar_actions

                agent_payload = dict(custom_data.get("agent") or {})
                agent_payload["routing_mode"] = routing_mode
                agent_payload["pre_router_candidate_count"] = pre_router_candidate_count
                if pre_routed_skill:
                    agent_payload["pre_routed_skill"] = pre_routed_skill.name
                if cap_reached:
                    agent_payload["cap_reached"] = True
                custom_data["agent"] = agent_payload
                if handoff_triggered:
                    custom_data = self._apply_handoff_metadata(
                        cid=cid,
                        room_uuid=room_uuid,
                        custom_data=custom_data,
                        reason=handoff_reason,
                        detail=handoff_detail,
                        last_tool_name=last_tool_name,
                        last_tool_call_id=last_tool_call_id,
                        last_tool_args_preview=last_tool_args_preview,
                    )

                ai_message.custom_data = custom_data
                ai_message.updated_at = timezone.now()
                if reason == "timeout":
                    ai_message.save(update_fields=["custom_data", "updated_at"])
                else:
                    ai_message.body = reply_text
                    ai_message.save(
                        update_fields=["body", "custom_data", "updated_at"]
                    )
                if room is not None:
                    mark_agent_state(
                        room=room,
                        ai_state=final_state,
                        ai_message=ai_message,
                        error_reason=error_reason,
                    )
                message = ai_message
            else:
                message = self._persist_reply(
                    cid=cid, text=reply_text, handoff=handoff_triggered
                )
                # NEW: attach sidecar suggestions to this message too
                custom_data_for_message = {**(message.custom_data or {})}
                if sidecar_items:
                    custom_data_for_message["sidecar_items"] = sidecar_items
                if sidecar_actions:
                    custom_data_for_message["sidecar_actions"] = sidecar_actions
                agent_payload = dict(custom_data_for_message.get("agent") or {})
                agent_payload["routing_mode"] = routing_mode
                agent_payload["pre_router_candidate_count"] = pre_router_candidate_count
                if pre_routed_skill:
                    agent_payload["pre_routed_skill"] = pre_routed_skill.name
                if cap_reached:
                    agent_payload["cap_reached"] = True
                custom_data_for_message["agent"] = agent_payload
                if handoff_triggered:
                    custom_data_for_message = self._apply_handoff_metadata(
                        cid=cid,
                        room_uuid=room_uuid,
                        custom_data=custom_data_for_message,
                        reason=handoff_reason,
                        detail=handoff_detail,
                        last_tool_name=last_tool_name,
                        last_tool_call_id=last_tool_call_id,
                        last_tool_args_preview=last_tool_args_preview,
                    )
                if custom_data_for_message != message.custom_data:
                    self._update_message(message, custom_data=custom_data_for_message)

            self._mark_provenance(message)
            if handoff_triggered:
                self._notify_handoff(cid)
        else:
            message = None

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
                handoff=handoff_triggered,
                handoff_reason=handoff_reason,
                handoff_detail=handoff_detail,
                last_tool_name=last_tool_name,
                last_tool_call_id=last_tool_call_id,
                last_tool_args_preview=last_tool_args_preview,
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
            message=message,
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
        meta = meta or {}
        messages: list[dict[str, Any]] = []

        # RAG context: if present, prepend as a system message
        rag_context = meta.get("rag_context")
        if rag_context:
            messages.append({"role": "system", "content": str(rag_context)})

        # Existing history handling
        history = meta.get("history")
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
        sanitized_messages = self._sanitize_tool_messages(messages, meta=meta)
        messages[:] = sanitized_messages
        timeout = (meta or {}).get("timeout")
        fallback_timeout = getattr(self.llm_client, "default_timeout", None)
        return self.llm_client.run(
            messages,
            tools=tools or None,
            model=AGENT_MODEL,
            max_tokens=AGENT_MAX_TOKENS,
            timeout=timeout if timeout is not None else fallback_timeout,
        )

    def _call_llm_streaming(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        meta: dict[str, Any] | None,
        *,
        stream_target: Message | None = None,
        handoff_message: str | None = None,
        room: Room | None = None,
        run_id: str | None = None,
        ) -> LLMResult:
        sanitized_messages = self._sanitize_tool_messages(messages, meta=meta)
        messages[:] = sanitized_messages

        timeout = (meta or {}).get("timeout")
        cid = (meta or {}).get("cid")
        streaming_timeout = (
            timeout
            or getattr(self.llm_client, "default_streaming_timeout", None)
            or AGENT_STREAMING_TIMEOUT_SEC
        )
        
        if stream_target is None or not hasattr(self.llm_client.provider, "run_streaming"):
            return self.llm_client.run(
                messages,
                tools=tools or None,
                model=AGENT_MODEL,
                max_tokens=AGENT_MAX_TOKENS,
                timeout=timeout if timeout is not None else streaming_timeout,
            )

        if room is None and cid:
            room = self._get_room_for_cid(cid)

        if room is not None:
            mark_agent_state(
                room=room,
                ai_state="AI_STATE_GENERATING",
                ai_message=stream_target,
            )

        def on_update(buffer: str) -> None:
            if run_id and self._is_run_cancelled(run_id):
                raise CancelledError("Agent run cancelled")
            self._update_message(stream_target, text=buffer)
            if AGENT_STREAMING_DEBUG and logger.isEnabledFor(logging.DEBUG):
                logger.debug(
                    "agent.llm.streaming.chunk",
                    extra={
                        "cid": cid,
                        "trace_id": trace_id,
                        "length": len(buffer),
                        "room_uuid": str(getattr(room, "uuid", "")) or None,
                        "agent_run_id": run_id,
                    },
                )

        trace_id = (meta or {}).get("trace_id") or (meta or {}).get("request_id")
        cid = (meta or {}).get("cid")
        job_id = (meta or {}).get("job_id")
        logger.info(
            "agent.llm.streaming.start",
            extra={
                "cid": cid,
                "trace_id": trace_id,
                "timeout_sec": streaming_timeout,
                "job_id": job_id,
                "model": AGENT_MODEL,
                "max_tokens": AGENT_MAX_TOKENS,
            },
        )

        start = time.perf_counter()
        try:
            result = self.llm_client.run_streaming(
                messages,
                tools=tools or None,
                model=AGENT_MODEL,
                max_tokens=AGENT_MAX_TOKENS,
                timeout=streaming_timeout,
                on_update=on_update,
                context={
                    "cid": cid,
                    "trace_id": trace_id,
                    "job_id": (meta or {}).get("job_id"),
                },
            )
            logger.info(
                "agent.llm.streaming.success",
                extra={
                    "cid": cid,
                    "trace_id": trace_id,
                    "job_id": job_id,
                    "agent_run_id": run_id,
                    "latency_ms": int((time.perf_counter() - start) * 1000),
                },
            )
            return result
        except TimeoutError:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            logger.warning(
                "agent.llm.streaming_timeout",
                extra={
                    "cid": cid,
                    "trace_id": trace_id,
                    "job_id": job_id,
                    "agent_run_id": run_id,
                    "room_uuid": str(getattr(room, "uuid", "")) or None,
                    "latency_ms": elapsed_ms,
                    "timeout_sec": streaming_timeout,
                },
            )
            # For streaming timeouts, always use the explicit timeout text. Handoff
            # behavior is handled later in the orchestration flow.
            fallback_text = self.streaming_timeout_text
            if stream_target is not None:
                partial_text = stream_target.body or getattr(stream_target, "text", "") or ""
                if partial_text and not partial_text.endswith(("…", ".", "!", "?")):
                    partial_text = partial_text.rstrip() + "…"

                timeout_custom_data = {**(stream_target.custom_data or {})}
                timeout_custom_data["ai_generated"] = True
                stream_target.body = partial_text
                stream_target.custom_data = timeout_custom_data
                stream_target.updated_at = timezone.now()
                stream_target.save(
                    update_fields=["body", "custom_data", "updated_at"]
                )
                if room is not None:
                    mark_agent_state(
                        room=room,
                        ai_state="AI_STATE_IDLE",
                        ai_message=stream_target,
                    )
                logger.info(
                    "agent.llm.streaming_timeout.fallback",
                    extra={
                        "cid": cid,
                        "trace_id": trace_id,
                        "job_id": job_id,
                        "agent_run_id": run_id,
                        "fallback_text": fallback_text[:80],
                    },
                )
                timeout_custom_data_2 = {"ai_generated": True}

                from ..tasks import _persist_message

                timeout_msg = _persist_message(
                    cid=cid,
                    text=fallback_text,
                    custom_data=timeout_custom_data_2,
                )
                if room is not None:
                    mark_agent_state(
                        room=room,
                        ai_state="AI_STATE_IDLE",
                        ai_message=timeout_msg,
                        error_reason="timeout",
                    )
                logger.info(
                    "agent.llm.streaming_timeout.secondary_message",
                    extra={
                        "cid": cid,
                        "trace_id": trace_id,
                        "job_id": job_id,
                        "agent_run_id": run_id,
                        "timeout_message_id": str(timeout_msg.id),
                    },
                )
            return LLMResult(
                content=fallback_text,
                tokens_used=0,
                model=AGENT_MODEL,
                latency_ms=elapsed_ms,
                cost_usd=Decimal("0"),
                reason="timeout",
            )
        except CancelledError:
            logger.info(
                "agent.llm.streaming.cancelled",
                extra={
                    "cid": cid,
                    "trace_id": trace_id,
                    "job_id": job_id,
                    "agent_run_id": run_id,
                },
            )
            raise
        except Exception:
            # Log and fall back to non-streaming so we don't regress to 500s
            logger.exception(
                "agent.llm.streaming_failure",
                extra={
                    "cid": messages[0].get("cid", None),
                    "trace_id": trace_id,
                    "job_id": job_id,
                    "agent_run_id": run_id,
                },
            )
            # As a fallback, do a single-shot call and just update the message once
            result = self._call_llm(messages, tools, meta)
            self._update_message(stream_target, text=result.content)
            return result

    def _finalize_generated_messages(self, reply: AgentReply, meta: dict[str, Any]) -> None:
        messages = reply.messages or []
        if not messages:
            logger.warning(
                "agent.generate.job.no_messages",
                extra={"cid": meta.get("cid"), "trace_id": meta.get("trace_id")},
            )
            return

        agent_message = messages[0]
        custom_data = dict(agent_message.custom_data or {})
        if not custom_data.get("ai_generated"):
            custom_data["ai_generated"] = True
            agent_message.custom_data = custom_data
            agent_message.save(update_fields=["custom_data", "updated_at"])

        MessageProvenance.objects.get_or_create(
            message=agent_message,
            defaults={"source": MessageProvenance.Source.AGENT},
        )

    def _execute_tool_calls(
        self,
        calls: Sequence[ToolCall],
        skill_lookup: dict[str, Skill],
        ctx: ConversationCtx,
        messages: list[dict[str, Any]],
        *,
        limit: int | None,
        on_before_execute: Callable[[ToolCall, Skill | None], None] | None = None,
        on_exception: Callable[[ToolCall, Skill | None, Exception], None] | None = None,
    ) -> list[str]:
        executed: list[str] = []
        remaining = limit if limit is None else max(limit, 0)
        calls_with_ids = [ensure_tool_call_id(call) for call in calls]

        if calls_with_ids:
            messages.append(_assistant_tool_calls_message(calls_with_ids))

        for call in calls_with_ids:
            if remaining is not None and remaining <= 0:
                break
            skill = skill_lookup.get(call.name)
            tool_name = skill.name if skill else call.name
            content: str

            if on_before_execute:
                on_before_execute(call, skill)

            if not skill:
                logger.warning("agent.tool.unknown", extra={"tool": call.name})
                content = json.dumps(
                    {
                        "ok": False,
                        "error": "Unknown tool",
                        "type": "ToolNotFound",
                        "tool": call.name,
                    }
                )
            else:
                try:
                    if on_before_execute:
                        on_before_execute(call, skill)
                    payload = skill.execute(call.arguments, ctx)
                except Exception as exc:  # pragma: no cover - defensive
                    logger.exception("agent.tool.failure", extra={"tool": call.name})
                    if on_exception:
                        on_exception(call, skill, exc)
                    content = json.dumps(
                        {
                            "ok": False,
                            "error": str(exc),
                            "type": exc.__class__.__name__,
                            "tool": call.name,
                        }
                    )
                else:
                    executed.append(skill.name)
                    if remaining is not None:
                        remaining -= 1
                    content = self._serialize_json(payload)
            messages.append(
                _tool_result_message(
                    call.id or "",
                    content,
                    name=tool_name,
                )
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

    def _select_pre_routed_skill(
        self,
        skills: Sequence[Skill],
        text: str,
        ctx: ConversationCtx,
    ) -> tuple[Skill | None, int]:
        candidates: list[Skill] = []
        for skill in skills:
            try:
                if skill.can_handle(text, ctx):
                    candidates.append(skill)
            except Exception:
                logger.exception(
                    "agent.pre_router.can_handle_failed",
                    extra={"skill": getattr(skill, "name", None)},
                )
        if len(candidates) == 1:
            return candidates[0], len(candidates)
        return None, len(candidates)

    def _select_pre_routed_tool_name(
        self,
        skill: Skill,
        tool_schemas: Sequence[dict[str, Any]],
        skill_lookup: dict[str, Skill],
    ) -> str | None:
        if not tool_schemas:
            return None

        tool_names: list[str] = []
        for schema in tool_schemas:
            if not isinstance(schema, dict):
                continue
            function_spec = schema.get("function", {})
            name = function_spec.get("name") if isinstance(function_spec, dict) else None
            if isinstance(name, str) and skill_lookup.get(name) is skill:
                tool_names.append(name)

        if len(tool_names) == 1:
            return tool_names[0]

        default_tool_name = getattr(skill, "default_tool_name", None)
        if isinstance(default_tool_name, str) and default_tool_name in tool_names:
            return default_tool_name
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
            executed = self._execute_tool_calls(
                [ToolCall(name=skill.name, arguments=args)],
                {skill.name: skill},
                ctx,
                messages,
                limit=1,
                on_before_execute=_remember_tool_attempt,
                on_exception=_note_tool_exception,
            )
            return bool(executed)
        except Exception:  # pragma: no cover - defensive
            logger.exception("agent.fallback.failure", extra={"tool": skill.name})
            return False

    def _sanitize_tool_messages(
        self, messages: list[dict[str, Any]], *, meta: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        sanitized: list[dict[str, Any]] = []
        latest_tool_call_ids: set[str] = set()
        last_message_had_tool_calls = False
        cid = (meta or {}).get("cid")
        debug_mode = bool(getattr(settings, "DEBUG", False))

        for index, message in enumerate(messages):
            role = message.get("role") if isinstance(message, dict) else None
            if role == "assistant" and isinstance(message.get("tool_calls"), list):
                latest_tool_call_ids = {
                    tc.get("id")
                    for tc in message.get("tool_calls", [])
                    if isinstance(tc, dict) and isinstance(tc.get("id"), str)
                }
                last_message_had_tool_calls = bool(latest_tool_call_ids)
                sanitized.append(message)
                continue

            if role == "tool":
                tool_call_id = message.get("tool_call_id")
                if last_message_had_tool_calls and tool_call_id in latest_tool_call_ids:
                    sanitized.append(message)
                else:
                    if debug_mode:
                        logger.warning(
                            "agent.tool.orphaned_message_dropped",
                            extra={
                                "cid": cid,
                                "tool_call_id": tool_call_id,
                                "index": index,
                            },
                        )
                continue

            latest_tool_call_ids = set()
            last_message_had_tool_calls = False
            sanitized.append(message)

        return sanitized

    def _serialize_json(self, payload: Any) -> str:
        try:
            return json.dumps(payload, default=str)
        except TypeError:  # pragma: no cover - defensive
            return json.dumps({"result": str(payload)})

    def _apply_handoff_metadata(
        self,
        *,
        cid: str,
        room_uuid: str | None,
        custom_data: dict[str, Any],
        reason: str | None,
        detail: str | None,
        last_tool_name: str | None,
        last_tool_call_id: str | None,
        last_tool_args_preview: str | None,
    ) -> dict[str, Any]:
        detail_preview = detail
        if detail_preview and len(detail_preview) > 300:
            detail_preview = detail_preview[:299] + "…"

        agent_payload = dict(custom_data.get("agent") or {})
        agent_payload.update(
            {
                "handoff": True,
                "handoff_reason": reason or HandoffReason.UNKNOWN,
                "handoff_detail": detail_preview,
                "last_tool_name": last_tool_name,
                "last_tool_call_id": last_tool_call_id,
                "last_tool_args_preview": last_tool_args_preview,
            }
        )

        merged = {**custom_data, "agent": agent_payload, "ai_generated": True}
        self._log_handoff(
            cid=cid,
            room_uuid=room_uuid,
            reason=agent_payload["handoff_reason"],
            detail=detail_preview,
            last_tool_name=last_tool_name,
            last_tool_call_id=last_tool_call_id,
            last_tool_args_preview=last_tool_args_preview,
        )
        return merged

    def _log_handoff(
        self,
        *,
        cid: str,
        room_uuid: str | None,
        reason: str,
        detail: str | None,
        last_tool_name: str | None,
        last_tool_call_id: str | None,
        last_tool_args_preview: str | None,
    ) -> None:
        detail_preview = detail
        if detail_preview and len(detail_preview) > 300:
            detail_preview = detail_preview[:299] + "…"

        logger.warning(
            "agent.handoff",
            extra={
                "cid": cid,
                "room_uuid": room_uuid,
                "handoff_reason": reason,
                "handoff_detail": detail_preview,
                "last_tool_name": last_tool_name,
                "last_tool_call_id": last_tool_call_id,
                "last_tool_args_preview": last_tool_args_preview,
            },
        )

    def _persist_message(
        self, *, cid: str, text: str, custom_data: dict[str, Any] | None = None
    ) -> Message:
        payload: dict[str, Any] = {"text": text}
        if custom_data is not None:
            payload["custom_data"] = custom_data

        serializer = MessageSerializer(data=payload)
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

    def _persist_reply(self, *, cid: str, text: str, handoff: bool) -> Message:
        custom_data = {"agent": {"handoff": handoff}, "ai_generated": True}
        return self._persist_message(cid=cid, text=text, custom_data=custom_data)

    def _update_message(
        self,
        message: Message,
        *,
        text: str | None = None,
        custom_data: dict[str, Any] | None = None,
    ) -> None:
        update_fields = ["updated_at"]
        if text is not None:
            message.body = text
            update_fields.append("body")
        if custom_data is not None:
            message.custom_data = custom_data
            update_fields.append("custom_data")
        message.updated_at = timezone.now()
        message.save(update_fields=update_fields)
        if os.environ.get("DISABLE_AGENT_BROADCAST"):
            return
        try:
            broadcast_message_update(message)
        except RuntimeError:
            logger.debug(
                "agent.message.broadcast_skipped",
                extra={"message_id": getattr(message, "id", None)},
            )
        except Exception:
            logger.exception(
                "agent.message.broadcast_failed",
                extra={"message_id": getattr(message, "id", None)},
            )

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
        handoff: bool,
        handoff_reason: str | None,
        handoff_detail: str | None,
        last_tool_name: str | None,
        last_tool_call_id: str | None,
        last_tool_args_preview: str | None,
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
                "handoff": handoff,
                "handoff_reason": handoff_reason or "",
                "handoff_detail": handoff_detail or "",
                "last_tool_name": last_tool_name or "",
                "last_tool_call_id": last_tool_call_id or "",
                "last_tool_args_preview": last_tool_args_preview or "",
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
def _assistant_tool_calls_message(tool_calls: list[ToolCall]) -> dict[str, Any]:
    return {
        "role": "assistant",
        "tool_calls": [
            {
                "id": tc.id,
                "type": "function",
                "function": {
                    "name": tc.name,
                    "arguments": json.dumps(tc.arguments, default=str, ensure_ascii=False),
                },
            }
            for tc in tool_calls
        ],
    }


def _tool_result_message(
    tool_call_id: str, content: str, *, name: str | None = None
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "role": "tool",
        "tool_call_id": tool_call_id,
        "content": content,
    }
    if name:
        payload["name"] = name
    return payload
