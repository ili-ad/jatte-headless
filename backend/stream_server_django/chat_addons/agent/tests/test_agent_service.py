from __future__ import annotations

import copy
import json
import os
import sys
import time
from decimal import Decimal
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[5]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
BACKEND_DIR = BASE_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")

import django

django.setup()

import pytest
from django.conf import settings

from stream_server_django.chat_addons.agent.services.agent_service import (
    AgentReply,
    AgentService,
    HandoffReason,
    ToolCallProtocolError,
)
from stream_server_django.chat_addons.agent.services.llm_client import (
    BudgetExceeded,
    CannedProvider,
    CostGuard,
    LLMClient,
)
from stream_server_django.chat_addons.agent.registry import enabled_for_room
from stream_server_django.chat_addons.agent.models import AgentRoomPolicy, AgentRun
from stream_server_django.chat.models import Message


class _ImmediateProvider:
    def __init__(self, text: str = "ok", *, latency_ms: int = 12) -> None:
        self.text = text
        self.latency_ms = latency_ms

    def run(self, *, messages, tools, model, max_tokens, timeout=None):
        _ = (messages, tools, model, max_tokens, timeout)
        return {
            "content": self.text,
            "tokens_used": 12,
            "cost_usd": Decimal("0.00012"),
        }


class _RejectingGuard(CostGuard):
    def ensure_within_budget(self, projected_cost: Decimal) -> None:
        raise BudgetExceeded("budget exceeded for test")

    def record_cost(self, cost: Decimal) -> None:  # pragma: no cover - should not run
        raise AssertionError("record_cost should not be called when budget is rejected")


class _SlowProvider:
    def run(self, *, messages, tools, model, max_tokens, timeout=None):
        _ = (messages, tools, model, max_tokens, timeout)
        time.sleep(0.2)
        return {
            "content": "slow",
            "tokens_used": 10,
            "cost_usd": Decimal("0.00005"),
        }


class _HangingProvider(_SlowProvider):
    def run(self, *, messages, tools, model, max_tokens, timeout=None):
        _ = (messages, tools, model, max_tokens, timeout)
        time.sleep(1)
        return {
            "content": "never reached",
            "tokens_used": 1,
            "cost_usd": Decimal("0.00001"),
        }


class _StreamingSleeper:
    def __init__(self, delay: float = 0.2) -> None:
        self.delay = delay

    def run(self, *, messages, tools, model, max_tokens, timeout=None):
        _ = (messages, tools, model, max_tokens, timeout)
        return {
            "content": "fallback",
            "tokens_used": 1,
            "cost_usd": Decimal("0.00001"),
        }

    def run_streaming(
        self,
        *,
        messages,
        tools,
        model,
        max_tokens,
        timeout=None,
        on_update=None,
    ):
        _ = (messages, tools, model, max_tokens, timeout, on_update)
        if on_update:
            on_update("partial response")
        time.sleep(self.delay)
        return {
            "content": "fallback",
            "tokens_used": 1,
            "cost_usd": Decimal("0.00001"),
        }


class _StreamingChunkProvider:
    def __init__(self, chunks: list[str] | None = None) -> None:
        self.chunks = chunks or ["Hello", " world", "!"]

    def run(self, *, messages, tools, model, max_tokens, timeout=None):
        _ = (messages, tools, model, max_tokens, timeout)
        text = "".join(self.chunks)
        return {
            "content": text,
            "tokens_used": len(text),
            "cost_usd": Decimal("0.0005"),
        }

    def run_streaming(
        self,
        *,
        messages,
        tools,
        model,
        max_tokens,
        timeout=None,
        on_update=None,
    ):
        _ = (messages, tools, model, max_tokens, timeout)
        buffer = ""
        for chunk in self.chunks:
            buffer += chunk
            if on_update:
                on_update(buffer)
        return {
            "content": buffer,
            "tokens_used": len(buffer),
            "cost_usd": Decimal("0.0005"),
        }


class _ProtocolErrorProvider:
    def run(self, *, messages, tools, model, max_tokens, timeout=None):
        _ = (messages, tools, model, max_tokens, timeout)
        raise ToolCallProtocolError("orphan tool message")


class _ToolCallProvider:
    def run(self, *, messages, tools, model, max_tokens, timeout=None):
        _ = (messages, tools, model, max_tokens, timeout)
        return {
            "content": "",
            "messages": [
                {
                    "role": "assistant",
                    "tool_calls": [
                        {
                            "id": "call_123",
                            "function": {
                                "name": "utility_calc",
                                "arguments": "{\"expr\":\"2+2\"}",
                            },
                        }
                    ],
                }
            ],
            "tokens_used": 1,
            "cost_usd": 0,
        }


class _SequencedToolProvider:
    def __init__(self, *, include_tool_call: bool, final_text: str = "done") -> None:
        self.include_tool_call = include_tool_call
        self.final_text = final_text
        self.calls: list[list[dict]] = []

    def run(self, *, messages, tools, model, max_tokens, timeout=None):
        _ = (tools, model, max_tokens, timeout)
        self.calls.append(copy.deepcopy(list(messages)))
        if self.include_tool_call and len(self.calls) == 1:
            return {
                "content": "",
                "messages": [
                    {
                        "role": "assistant",
                        "tool_calls": [
                            {
                                "id": "call_ordering",
                                "type": "function",
                                "function": {
                                    "name": "utility_calc",
                                    "arguments": json.dumps({"expr": "2+2"}),
                                },
                            }
                        ],
                    }
                ],
                "tokens_used": 1,
                "cost_usd": Decimal("0"),
            }

        if len(self.calls) == 1:
            return {"content": "", "tokens_used": 1, "cost_usd": Decimal("0")}

        return {
            "content": self.final_text,
            "tokens_used": 1,
            "cost_usd": Decimal("0"),
        }


def test_agent_service_generate_returns_canned_reply() -> None:
    client = LLMClient(provider=CannedProvider())
    service = AgentService(llm_client=client)

    reply = service.generate(cid="messaging:test", user_id="user-1", text="hello")

    assert isinstance(reply, AgentReply)
    assert reply.text == "Let me connect you with a teammate."
    assert reply.reason == "handoff"
    assert reply.messages is not None
    assert len(reply.messages) == 1
    assert reply.messages[0].body == "Let me connect you with a teammate."


def test_llm_client_preserves_tool_call_id() -> None:
    client = LLMClient(provider=_ToolCallProvider())

    result = client.run([{"role": "user", "content": "calc"}])

    assert result.tool_calls
    assert result.tool_calls[0].id == "call_123"


def test_llm_client_enforces_timeout() -> None:
    client = LLMClient(provider=_SlowProvider(), default_timeout=0.5)

    with pytest.raises(TimeoutError):
        client.run([{"role": "user", "content": "hi"}], timeout=0.05)


def test_llm_client_budget_guard_short_circuits() -> None:
    client = LLMClient(provider=_ImmediateProvider(), cost_guard=_RejectingGuard())

    with pytest.raises(BudgetExceeded):
        client.run([{"role": "user", "content": "budget"}])


def test_agent_service_hands_off_on_llm_timeout() -> None:
    AgentRoomPolicy.objects.update_or_create(
        cid="messaging:timeout", defaults={"agent_enabled": True}
    )
    client = LLMClient(provider=_HangingProvider(), default_timeout=0.05)
    service = AgentService(llm_client=client)

    start = time.perf_counter()
    reply = service.generate(cid="messaging:timeout", user_id="user-2", text="hello")
    elapsed = time.perf_counter() - start

    assert reply.reason == "error"
    assert reply.text == service.streaming_timeout_text
    assert elapsed < 0.5


def test_agent_service_streaming_timeout_sets_idle_state(monkeypatch) -> None:
    AgentRoomPolicy.objects.update_or_create(
        cid="messaging:stream-timeout", defaults={"agent_enabled": True}
    )
    monkeypatch.setattr(
        "chat_addons.agent.services.agent_service.AGENT_STREAMING_TIMEOUT_SEC", 0.05
    )
    monkeypatch.setattr(
        "chat_addons.agent.services.llm_client.AGENT_STREAMING_TIMEOUT_SEC", 0.05
    )
    client = LLMClient(
        provider=_StreamingSleeper(delay=0.2),
        default_timeout=1,
    )
    service = AgentService(llm_client=client)

    start = time.perf_counter()
    reply = service.generate(
        cid="messaging:stream-timeout", user_id="user-3", text="hello"
    )
    elapsed = time.perf_counter() - start

    assert reply.reason in (AgentRun.STATUS_ERROR, "timeout")
    assert reply.text == service.streaming_timeout_text
    assert elapsed < 0.5
    assert reply.messages
    final_message: Message = reply.messages[0]
    assert final_message.custom_data.get("ai_generated") is True
    assert final_message.custom_data.get("ai_state") == "AI_STATE_IDLE"
    assert final_message.body == "partial response…"
    assert final_message.custom_data.get("error_reason") == "timeout"
    assert final_message.custom_data.get("agent", {}).get("handoff") is True

    timeout_messages = Message.objects.filter(body=service.streaming_timeout_text)
    assert timeout_messages.exists()
    timeout_message = timeout_messages.first()
    assert timeout_message
    assert timeout_message.custom_data.get("ai_generated") is True
    assert timeout_message.custom_data.get("ai_state") == "AI_STATE_IDLE"
    assert timeout_message.custom_data.get("error_reason") == "timeout"


def test_tool_call_messages_follow_assistant_invocation(db) -> None:
    AgentRoomPolicy.objects.update_or_create(
        cid="messaging:tool-order", defaults={"agent_enabled": True, "enabled_skills": ["utility_calc"]}
    )
    provider = _SequencedToolProvider(include_tool_call=True)
    client = LLMClient(provider=provider)
    service = AgentService(llm_client=client)

    reply = service.generate(cid="messaging:tool-order", user_id="user-llm", text="2+2")

    assert reply.reason == AgentRun.STATUS_OK
    assert len(provider.calls) >= 2
    messages = provider.calls[1]

    assistant_index = next(
        i
        for i, message in enumerate(messages)
        if message.get("role") == "assistant" and message.get("tool_calls")
    )
    tool_calls = messages[assistant_index]["tool_calls"]
    assert isinstance(tool_calls, list)
    tool_ids = [tc.get("id") for tc in tool_calls if isinstance(tc, dict)]
    assert tool_ids

    following = messages[assistant_index + 1 : assistant_index + 1 + len(tool_ids)]
    assert all(msg.get("role") == "tool" for msg in following)
    assert [msg.get("tool_call_id") for msg in following] == tool_ids


def test_tool_failure_emits_tool_message(monkeypatch, db) -> None:
    cid = "messaging:tool-failure"
    AgentRoomPolicy.objects.update_or_create(
        cid=cid, defaults={"agent_enabled": True, "enabled_skills": ["utility_calc"]}
    )
    provider = _SequencedToolProvider(include_tool_call=True, final_text="handled")
    client = LLMClient(provider=provider)
    service = AgentService(llm_client=client)

    failing_skill = next(
        (skill for skill in enabled_for_room(cid) if skill.name == "utility_calc"),
        None,
    )
    assert failing_skill is not None

    def boom(args, ctx):
        _ = (args, ctx)
        raise RuntimeError("kaboom")

    monkeypatch.setattr(failing_skill, "execute", boom)

    reply = service.generate(cid=cid, user_id="user-tool-failure", text="2+2")

    assert reply.reason == AgentRun.STATUS_OK
    assert reply.text == "handled"
    assert len(provider.calls) >= 2

    messages = provider.calls[1]

    assistant_index = next(
        i
        for i, message in enumerate(messages)
        if message.get("role") == "assistant" and message.get("tool_calls")
    )
    tool_calls = messages[assistant_index]["tool_calls"]
    tool_ids = [tc.get("id") for tc in tool_calls if isinstance(tc, dict)]
    assert tool_ids

    following = messages[assistant_index + 1 : assistant_index + 1 + len(tool_ids)]
    assert all(msg.get("role") == "tool" for msg in following)
    assert [msg.get("tool_call_id") for msg in following] == tool_ids

    for msg in following:
        payload = json.loads(msg.get("content"))
        assert payload.get("ok") is False
        assert payload.get("tool") == "utility_calc"
        assert payload.get("type") == "RuntimeError"
        assert payload.get("error") == "kaboom"


def test_tool_exception_marks_handoff_metadata(monkeypatch, db) -> None:
    cid = "messaging:tool-handoff"
    AgentRoomPolicy.objects.update_or_create(
        cid=cid, defaults={"agent_enabled": True, "enabled_skills": ["utility_calc"]}
    )
    provider = _SequencedToolProvider(include_tool_call=True, final_text="")
    client = LLMClient(provider=provider)
    service = AgentService(llm_client=client)

    failing_skill = next(
        (skill for skill in enabled_for_room(cid) if skill.name == "utility_calc"),
        None,
    )
    assert failing_skill is not None

    def boom(args, ctx):
        _ = (args, ctx)
        raise RuntimeError("kaboom")

    monkeypatch.setattr(failing_skill, "execute", boom)

    reply = service.generate(cid=cid, user_id="user-tool-handoff", text="2+2")

    assert reply.messages
    final_message: Message = reply.messages[0]
    agent_meta = final_message.custom_data.get("agent", {})

    assert agent_meta.get("handoff") is True
    assert agent_meta.get("handoff_reason") == HandoffReason.TOOL_EXCEPTION
    assert "RuntimeError" in (agent_meta.get("handoff_detail") or "")
    assert agent_meta.get("last_tool_name") == "utility_calc"
    assert agent_meta.get("last_tool_call_id")


def test_tool_cap_sets_capped_reason(db) -> None:
    cid = "messaging:cap-reason"
    AgentRoomPolicy.objects.update_or_create(
        cid=cid,
        defaults={
            "agent_enabled": True,
            "enabled_skills": ["utility_calc"],
            "tool_hop_cap": 1,
            "turn_cap": 3,
        },
    )
    provider = _SequencedToolProvider(include_tool_call=True, final_text="handled")
    client = LLMClient(provider=provider)
    service = AgentService(llm_client=client)

    reply = service.generate(cid=cid, user_id="user-cap", text="2+2")

    assert reply.messages
    assert reply.reason == AgentRun.STATUS_CAPPED
    final_message: Message = reply.messages[0]
    agent_meta = final_message.custom_data.get("agent", {})

    assert agent_meta.get("handoff_reason") == HandoffReason.CAPPED
    assert agent_meta.get("handoff_detail") == "tool hop cap reached"
    assert agent_meta.get("last_tool_name") == "utility_calc"
    assert agent_meta.get("last_tool_call_id")
    assert "2+2" in (agent_meta.get("last_tool_args_preview") or "")

    run = AgentRun.objects.order_by("-created_at").first()
    assert run
    assert run.handoff is True
    assert run.handoff_reason == HandoffReason.CAPPED
    assert run.handoff_detail == "tool hop cap reached"
    assert run.last_tool_name == "utility_calc"
    assert run.last_tool_call_id
    assert "2+2" in run.last_tool_args_preview


def test_no_tools_enabled_marks_handoff_reason(db) -> None:
    cid = "messaging:no-tools"
    AgentRoomPolicy.objects.update_or_create(
        cid=cid, defaults={"agent_enabled": False, "enabled_skills": []}
    )
    service = AgentService(llm_client=LLMClient(provider=CannedProvider()))

    reply = service.generate(cid=cid, user_id="user-no-tools", text="hello")

    assert reply.messages
    final_message: Message = reply.messages[0]
    agent_meta = final_message.custom_data.get("agent", {})

    assert agent_meta.get("handoff") is True
    assert agent_meta.get("handoff_reason") == HandoffReason.NO_TOOLS_ENABLED
    assert agent_meta.get("handoff_detail")


def test_protocol_errors_mark_handoff_reason(db) -> None:
    cid = "messaging:protocol-error"
    AgentRoomPolicy.objects.update_or_create(
        cid=cid,
        defaults={"agent_enabled": True, "enabled_skills": ["utility_calc"]},
    )
    service = AgentService(llm_client=LLMClient(provider=_ProtocolErrorProvider()))

    reply = service.generate(cid=cid, user_id="user-protocol", text="hi")

    assert reply.messages
    final_message: Message = reply.messages[0]
    agent_meta = final_message.custom_data.get("agent", {})

    assert agent_meta.get("handoff_reason") == HandoffReason.TOOL_CALL_PROTOCOL_ERROR
    assert "orphan tool message" in (agent_meta.get("handoff_detail") or "")

    run = AgentRun.objects.order_by("-created_at").first()
    assert run
    assert run.handoff is True
    assert run.handoff_reason == HandoffReason.TOOL_CALL_PROTOCOL_ERROR
    assert "orphan tool message" in run.handoff_detail


def test_fallback_tool_invocation_inserts_assistant_and_results(db) -> None:
    AgentRoomPolicy.objects.update_or_create(
        cid="messaging:fallback-order",
        defaults={"agent_enabled": True, "enabled_skills": ["utility_calc"]},
    )
    provider = _SequencedToolProvider(include_tool_call=False, final_text="all set")
    client = LLMClient(provider=provider)
    service = AgentService(llm_client=client)

    reply = service.generate(cid="messaging:fallback-order", user_id="user-fallback", text="2+2")

    assert reply.reason == AgentRun.STATUS_OK
    assert len(provider.calls) >= 2
    messages = provider.calls[1]

    assistant_index = next(
        i
        for i, message in enumerate(messages)
        if message.get("role") == "assistant" and message.get("tool_calls")
    )
    tool_ids = [
        tc.get("id")
        for tc in messages[assistant_index].get("tool_calls", [])
        if isinstance(tc, dict)
    ]
    assert tool_ids

    following = messages[assistant_index + 1 : assistant_index + 1 + len(tool_ids)]
    assert all(msg.get("role") == "tool" for msg in following)
    assert [msg.get("tool_call_id") for msg in following] == tool_ids


def test_sanitize_drops_orphan_tool_messages(monkeypatch) -> None:
    monkeypatch.setattr(settings, "DEBUG", True)
    service = AgentService(llm_client=LLMClient(provider=CannedProvider()))

    messages = [
        {"role": "user", "content": "hi"},
        {"role": "tool", "tool_call_id": "abc", "content": "result"},
    ]

    sanitized = service._sanitize_tool_messages(messages, meta={"cid": "cid"})

    assert sanitized == [{"role": "user", "content": "hi"}]


def test_llm_client_streaming_emits_incremental_updates() -> None:
    updates: list[str] = []
    provider = _StreamingChunkProvider()
    client = LLMClient(provider=provider, default_streaming_timeout=1)

    result = client.run_streaming(
        [{"role": "user", "content": "hi"}], on_update=updates.append
    )

    assert updates == ["Hello", "Hello world", "Hello world!"]
    assert result.content == "Hello world!"
    assert result.reason == "ok"
