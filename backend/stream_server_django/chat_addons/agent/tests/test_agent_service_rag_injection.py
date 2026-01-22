from __future__ import annotations

import copy
import os
import sys
from decimal import Decimal
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

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

from stream_server_django.chat_addons.agent.models import AgentRoomPolicy
from stream_server_django.chat_addons.agent.services import agent_service as agent_service_module
from stream_server_django.chat_addons.agent.services.agent_service import AgentService
from stream_server_django.chat_addons.agent.services.llm_client import LLMClient


class _CapturingProvider:
    def __init__(self) -> None:
        self.calls: list[list[dict]] = []

    def run(self, *, messages, tools, model, max_tokens, timeout=None):
        _ = (tools, model, max_tokens, timeout)
        self.calls.append(copy.deepcopy(list(messages)))
        return {
            "content": "ok",
            "tokens_used": 1,
            "cost_usd": Decimal("0"),
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
        _ = (tools, model, max_tokens, timeout)
        self.calls.append(copy.deepcopy(list(messages)))
        if on_update:
            on_update("ok")
        return {
            "content": "ok",
            "tokens_used": 1,
            "cost_usd": Decimal("0"),
        }


def test_rag_context_is_injected_before_provider_call(db) -> None:
    AgentRoomPolicy.objects.update_or_create(
        cid="messaging:rag-injection", defaults={"agent_enabled": True}
    )
    provider = _CapturingProvider()
    service = AgentService(llm_client=LLMClient(provider=provider))
    chunk = SimpleNamespace(
        id="chunk-1",
        heading="Lien timing",
        text="Record the claim of lien within 90 days of final furnishing.",
    )

    with (
        mock.patch.object(agent_service_module, "embed_query", return_value=[0.01]),
        mock.patch.object(agent_service_module, "search_similar", return_value=[chunk]),
    ):
        service.generate(
            cid="messaging:rag-injection",
            user_id="user-rag",
            text="When do I need to record a lien?",
            meta={"use_rag": True, "state": "ILPUB", "rag_topic": "product", "rag_k": 1},
        )

    assert provider.calls
    messages = provider.calls[0]

    assert messages[0]["role"] == "system"
    assert chunk.heading in messages[0]["content"]
    assert chunk.text in messages[0]["content"]
    assert messages[1]["role"] == "user"
    assert "record a lien" in messages[1]["content"]


def test_no_chunks_means_no_rag_system_message(db) -> None:
    AgentRoomPolicy.objects.update_or_create(
        cid="messaging:rag-empty", defaults={"agent_enabled": True}
    )
    provider = _CapturingProvider()
    service = AgentService(llm_client=LLMClient(provider=provider))

    with (
        mock.patch.object(agent_service_module, "embed_query", return_value=[0.01]),
        mock.patch.object(agent_service_module, "search_similar", return_value=[]),
    ):
        service.generate(
            cid="messaging:rag-empty",
            user_id="user-rag",
            text="What is a notice of commencement?",
            meta={"use_rag": True, "state": "ILPUB", "rag_topic": "product", "rag_k": 1},
        )

    assert provider.calls
    messages = provider.calls[0]

    assert messages[0]["role"] == "user"
    assert not any(message.get("role") == "system" for message in messages)
