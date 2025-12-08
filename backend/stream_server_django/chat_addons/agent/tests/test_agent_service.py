from __future__ import annotations

import os
import sys
import time
from decimal import Decimal
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[3]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")

import django

django.setup()

import pytest

from stream_server_django.chat_addons.agent.services.agent_service import AgentReply, AgentService
from stream_server_django.chat_addons.agent.services.llm_client import (
    BudgetExceeded,
    CannedProvider,
    CostGuard,
    LLMClient,
)
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
