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

from backend.chat_addons.agent.services.agent_service import AgentReply, AgentService
from backend.chat_addons.agent.services.llm_client import (
    BudgetExceeded,
    CannedProvider,
    CostGuard,
    LLMClient,
)


class _ImmediateProvider:
    def __init__(self, text: str = "ok", *, latency_ms: int = 12) -> None:
        self.text = text
        self.latency_ms = latency_ms

    def run(self, *, messages, tools, model, max_tokens):
        _ = (messages, tools, model, max_tokens)
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
    def run(self, *, messages, tools, model, max_tokens):
        _ = (messages, tools, model, max_tokens)
        time.sleep(0.2)
        return {
            "content": "slow",
            "tokens_used": 10,
            "cost_usd": Decimal("0.00005"),
        }


def test_agent_service_generate_returns_canned_reply() -> None:
    client = LLMClient(provider=CannedProvider())
    service = AgentService(llm_client=client)

    reply = service.generate(cid="messaging:test", user_id="user-1", text="hello")

    assert isinstance(reply, AgentReply)
    assert reply.text == AgentService.canned_text
    assert reply.reason == "success"


def test_llm_client_enforces_timeout() -> None:
    client = LLMClient(provider=_SlowProvider(), default_timeout=0.5)

    with pytest.raises(TimeoutError):
        client.run([{"role": "user", "content": "hi"}], timeout=0.05)


def test_llm_client_budget_guard_short_circuits() -> None:
    client = LLMClient(provider=_ImmediateProvider(), cost_guard=_RejectingGuard())

    with pytest.raises(BudgetExceeded):
        client.run([{"role": "user", "content": "budget"}])
