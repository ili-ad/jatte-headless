from __future__ import annotations

import os
import sys
from decimal import Decimal
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[4]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")
os.environ.setdefault("DATABASE_URL", "sqlite:///db.sqlite3")

import django

django.setup()

from stream_server_django.chat_addons.agent.services.llm_client import LLMClient


def _client() -> LLMClient:
    return LLMClient()


def test_coerce_result_preserves_tool_call_id():
    client = _client()
    payload = {
        "content": "",
        "messages": [
            {
                "role": "assistant",
                "tool_calls": [
                    {
                        "id": "call_123",
                        "type": "function",
                        "function": {
                            "name": "utility_calc",
                            "arguments": '{"expr":"2+2"}',
                        },
                    }
                ],
            }
        ],
        "tokens_used": 1,
        "cost_usd": Decimal("0"),
        "model": "gpt-4o-mini",
    }

    result = client._coerce_result(payload, model="gpt-4o-mini", latency_ms=5)

    assert len(result.tool_calls) == 1
    tool_call = result.tool_calls[0]
    assert tool_call.id == "call_123"
    assert tool_call.name == "utility_calc"
    assert tool_call.arguments["expr"] == "2+2"


def test_coerce_result_generates_tool_call_id_when_missing():
    client = _client()
    payload = {
        "content": "",
        "messages": [
            {
                "role": "assistant",
                "tool_calls": [
                    {
                        "type": "function",
                        "function": {
                            "name": "utility_calc",
                            "arguments": '{"expr":"5*5"}',
                        },
                    }
                ],
            }
        ],
        "tokens_used": 1,
        "cost_usd": Decimal("0"),
        "model": "gpt-4o-mini",
    }

    result = client._coerce_result(payload, model="gpt-4o-mini", latency_ms=5)

    assert len(result.tool_calls) == 1
    tool_call = result.tool_calls[0]
    assert isinstance(tool_call.id, str)
    assert tool_call.id.startswith("call_")
    assert tool_call.name == "utility_calc"
    assert tool_call.arguments["expr"] == "5*5"
