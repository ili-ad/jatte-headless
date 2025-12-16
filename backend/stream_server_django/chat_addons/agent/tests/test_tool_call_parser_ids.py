from __future__ import annotations

import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[4]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")
os.environ.setdefault("DATABASE_URL", "sqlite:///db.sqlite3")

import django

django.setup()

from stream_server_django.chat_addons.agent.services.tooling import parse_tool_instructions


def test_missing_id_generates_call_prefixed_with_call():
    content = '{"tool_calls": [{"name": "utility_calc", "arguments": {"expr": "2+2"}}]}'

    tool_calls, _ = parse_tool_instructions(content)

    assert len(tool_calls) == 1
    call = tool_calls[0]
    assert isinstance(call.id, str)
    assert call.id.startswith("call_")


def test_provided_id_is_preserved():
    content = '{"tool_calls": [{"id": "call_123", "name": "utility_calc", "arguments": {"expr": "2+2"}}]}'

    tool_calls, _ = parse_tool_instructions(content)

    assert len(tool_calls) == 1
    call = tool_calls[0]
    assert call.id == "call_123"


def test_arguments_parsed_from_json_string():
    content = '{"tool_calls": [{"name": "utility_calc", "arguments": "{\\"expr\\":\\"2+2\\"}"}]}'

    tool_calls, _ = parse_tool_instructions(content)

    assert len(tool_calls) == 1
    call = tool_calls[0]
    assert call.arguments == {"expr": "2+2"}
    assert isinstance(call.id, str) and call.id


def test_non_dict_arguments_coerced_to_input_wrapper():
    content = '{"tool_calls": [{"name": "utility_calc", "arguments": 5}]}'

    tool_calls, _ = parse_tool_instructions(content)

    assert len(tool_calls) == 1
    call = tool_calls[0]
    assert call.arguments == {"input": 5}
    assert isinstance(call.id, str) and call.id.startswith("call_")
