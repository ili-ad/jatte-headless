"""Agent service orchestration for automated chat replies."""
from __future__ import annotations

import json
import logging
import os
import time
import uuid
import threading
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal
from typing import Any, Callable, Sequence

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import close_old_connections
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from chat.api_views import _broadcast_to_cid
from chat.consumers import broadcast_message_update
from chat.models import Channel, Message, Room
from chat.serializers import MessageSerializer

from .vector_memory import embed_query, search_similar
from .metrics import estimate_prompt_tokens

from ..config import (
    AGENT_MAX_TOKENS,
    AGENT_MODEL,
    AGENT_STREAMING_TIMEOUT_SEC,
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


logger = logging.getLogger(__name__)

ACTIVE_WINDOW_SEC = getattr(settings, "ACTIVE_WINDOW_SEC", 120)


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

        policy = self._get_policy(cid)
        tool_hop_cap = max(int(policy.tool_hop_cap), 0)
        turn_cap = max(int(policy.turn_cap), 1)
        handoff_message = policy.handoff_message or self.canned_text

        skills = enabled_for_room(cid)
        tool_schemas = build_tool_schemas(skills) if skills else []
        skill_lookup = {skill.name: skill for skill in skills}

        tool_hops = 0
        turn = 0
        fallback_attempted = False

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

        if rag_enabled:
            # For now, default to Florida; can be generalized later.
            state = meta_payload.get("state") or "FL"
            topic = meta_payload.get("rag_topic")  # optional narrowing

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
                "agent.rag.result",
                extra={
                    "cid": cid,
                    "trace_id": request_id,
                    "rag_used": rag_used,
                    "rag_k": rag_k,
                    "top_score": top_score,
                    "top_ids": top_ids,
                },
            )

            if chunks:
                context_pieces: list[str] = []
                for chunk in chunks:
                    if chunk.heading:
                        context_pieces.append(f"## {chunk.heading}\n{chunk.text}")
                    else:
                        context_pieces.append(chunk.text)

                context_block = "\n\n---\n\n".join(context_pieces)

                rag_system = (
                    "You are a Florida construction lien assistant for contractors and suppliers, "
                    "not for lawyers. Your job is to explain Florida lien issues in plain English "
                    "and give practical next steps a contractor can follow.\n\n"
                    "Use the following context excerpts from my internal notes and caselaw summaries "
                    "as your primary source. If the context does not address the question, say so and "
                    "answer based on your general knowledge of Florida lien law, but prefer the context "
                    "whenever there is any tension.\n\n"
                    "Before you answer, silently decide whether the user's question is simple, moderate, "
                    "or complex from a Florida contractor's point of view. Do NOT mention this "
                    "classification in your answer.\n\n"
                    "Format your answer as follows:\n"
                    "1. Start with a short section titled 'Bottom line for you' that is one concise "
                    "paragraph a busy contractor can read in under 20 seconds.\n"
                    "2. Then add a section titled 'Practical steps' with 3–6 short, concrete bullets "
                    "describing what they should do next (e.g., demand letters, lien deadlines, when to "
                    "talk to a lawyer).\n"
                    "3. If helpful, finish with a single line titled 'For your lawyer' that gives at most "
                    "one or two Florida statute numbers (e.g., chapter 713 sections) or one key case name "
                    "drawn from the context. Do not write long case summaries.\n\n"
                    "Keep the tone calm, direct, and contractor-friendly. Avoid legal jargon where possible; "
                    "if you must use a legal term, briefly explain it in plain language. Assume the user "
                    "interface already shows that this is AI-generated and not legal advice, so do NOT start "
                    "with a long disclaimer. At most, you may end with one short sentence noting that this is "
                    "general information, not advice for a specific case.\n\n"
                    "=== CONTEXT START ===\n"
                    f"{context_block}\n"
                    "=== CONTEXT END ==="
                )

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
            logger.info("agent.rag.no_chunks", extra={"cid": cid, "state": state, "topic": topic})

        # From here on, use meta_payload instead of the original `meta`
        meta = meta_payload

        # Now that meta may contain rag_context, compose messages and ctx
        messages = self._compose_messages(message_text, meta=meta)
        ctx = self._conversation_ctx(cid=cid, user_id=user_id, meta=meta)




        ai_message: Message | None = None

        if persist and policy.agent_enabled:
            ai_message = self._persist_message(
                cid=cid,
                text="",
                custom_data={
                    "ai_generated": True,
                    "ai_state": "AI_STATE_THINKING",
                },
            )

        try:
            if not policy.agent_enabled:
                reply_text = handoff_message
                run_status = AgentRun.STATUS_HANDOFF
                handoff_triggered = True
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
                        break

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
            reply_text = self.streaming_timeout_text
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
            if ai_message is not None:
                final_state = "AI_STATE_IDLE"
                custom_data = {**(ai_message.custom_data or {})}
                if run_status == AgentRun.STATUS_ERROR and reason != "timeout":
                    final_state = "AI_STATE_ERROR"
                custom_data["ai_state"] = final_state
                if reason == "timeout":
                    custom_data["error_reason"] = "timeout"
                if handoff_triggered:
                    custom_data["agent"] = {"handoff": True}
                if rag_enabled:
                    custom_data.setdefault("rag", {})
                    custom_data["rag"].update({"used": rag_used, "k": rag_k})

                # For timeouts, do not overwrite the partial streaming text saved
                # earlier. Only update metadata.
                if reason == "timeout":
                    self._update_message(ai_message, text=None, custom_data=custom_data)
                else:
                    self._update_message(
                        ai_message, text=reply_text, custom_data=custom_data
                    )
                message = ai_message
            else:
                message = self._persist_reply(
                    cid=cid, text=reply_text, handoff=handoff_triggered
                )

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
    ) -> LLMResult:
        timeout = (meta or {}).get("timeout")
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

        custom_data = {**(stream_target.custom_data or {})}
        custom_data["ai_state"] = "AI_STATE_GENERATING"
        self._update_message(stream_target, custom_data=custom_data)

        def on_update(buffer: str) -> None:
            stream_custom_data = {**(stream_target.custom_data or {})}
            stream_custom_data["ai_state"] = "AI_STATE_GENERATING"
            self._update_message(
                stream_target, text=buffer, custom_data=stream_custom_data
            )
            logger.info(
                "agent.llm.streaming.chunk",
                extra={"cid": cid, "trace_id": trace_id, "length": len(buffer)},
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
            },
        )

        logger.info(
            "agent.llm.streaming.call",
            extra={
                "cid": cid,
                "trace_id": trace_id,
                "job_id": job_id,
                "model": AGENT_MODEL,
                "max_tokens": AGENT_MAX_TOKENS,
                "timeout_sec": streaming_timeout,
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
                timeout_custom_data["ai_state"] = "AI_STATE_IDLE"

                self._update_message(
                    stream_target, text=partial_text, custom_data=timeout_custom_data
                )
                logger.info(
                    "agent.llm.streaming_timeout.fallback",
                    extra={
                        "cid": cid,
                        "trace_id": trace_id,
                        "fallback_text": fallback_text[:80],
                    },
                )
                timeout_custom_data_2 = {
                    "ai_generated": True,
                    "ai_state": "AI_STATE_IDLE",
                    "error_reason": "timeout",
                }

                from ..tasks import _persist_message

                timeout_msg = _persist_message(
                    cid=cid,
                    text=fallback_text,
                    custom_data=timeout_custom_data_2,
                )
                logger.info(
                    "agent.llm.streaming_timeout.secondary_message",
                    extra={
                        "cid": cid,
                        "trace_id": trace_id,
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
        except Exception:
            # Log and fall back to non-streaming so we don't regress to 500s
            logger.exception(
                "agent.llm.streaming_failure",
                extra={"cid": messages[0].get("cid", None)},
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
