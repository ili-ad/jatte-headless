import os
import sys
from pathlib import Path

import pytest

BASE_DIR = Path(__file__).resolve().parents[4]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")
os.environ.setdefault("DATABASE_URL", "sqlite:///db.sqlite3")

import django

django.setup()

from stream_server_django.chat_addons.agent.services.llm_client import sanitize_messages_for_openai


def test_orphan_tool_message_dropped():
    messages = [
        {"role": "system", "content": "x"},
        {"role": "tool", "tool_call_id": "call_1", "content": "y"},
        {"role": "user", "content": "hi"},
    ]

    sanitized, stats = sanitize_messages_for_openai(messages, "drop")

    assert sanitized == [
        {"role": "system", "content": "x"},
        {"role": "user", "content": "hi"},
    ]
    assert stats["dropped"] == 1
    assert stats["converted"] == 0


def test_tool_message_without_id_is_dropped():
    messages = [
        {"role": "system", "content": "x"},
        {"role": "tool", "content": "missing id"},
    ]

    sanitized, stats = sanitize_messages_for_openai(messages, "drop")

    assert sanitized == [{"role": "system", "content": "x"}]
    assert stats["dropped"] == 1


def test_valid_tool_sequence_preserved():
    messages = [
        {
            "role": "assistant",
            "tool_calls": [
                {
                    "id": "call_1",
                    "type": "function",
                    "function": {"name": "x", "arguments": "{}"},
                }
            ],
        },
        {"role": "tool", "tool_call_id": "call_1", "content": "ok"},
        {"role": "assistant", "content": "done"},
    ]

    sanitized, stats = sanitize_messages_for_openai(messages, "drop")

    assert sanitized == messages
    assert stats["dropped"] == 0
    assert stats["converted"] == 0


def test_multiple_tool_messages_after_single_tool_call():
    messages = [
        {
            "role": "assistant",
            "tool_calls": [
                {
                    "id": "call_1",
                    "type": "function",
                    "function": {"name": "x", "arguments": "{}"},
                },
                {
                    "id": "call_2",
                    "type": "function",
                    "function": {"name": "y", "arguments": "{}"},
                },
            ],
        },
        {"role": "tool", "tool_call_id": "call_2", "content": "second"},
        {"role": "tool", "tool_call_id": "call_1", "content": "first"},
        {"role": "assistant", "content": "done"},
    ]

    sanitized, stats = sanitize_messages_for_openai(messages, "drop")

    assert sanitized == messages
    assert stats["dropped"] == 0
    assert stats["converted"] == 0


def test_tool_message_after_user_is_dropped():
    messages = [
        {
            "role": "assistant",
            "tool_calls": [
                {
                    "id": "call_1",
                    "type": "function",
                    "function": {"name": "x", "arguments": "{}"},
                }
            ],
        },
        {"role": "user", "content": "interrupt"},
        {"role": "tool", "tool_call_id": "call_1", "content": "late"},
    ]

    sanitized, stats = sanitize_messages_for_openai(messages, "drop")

    assert sanitized == messages[:2]
    assert stats["dropped"] == 1


def test_system_mode_converts_orphan_tool_message():
    messages = [
        {"role": "system", "content": "x"},
        {"role": "tool", "tool_call_id": "call_1", "content": "y"},
        {"role": "user", "content": "hi"},
    ]

    sanitized, stats = sanitize_messages_for_openai(messages, "system")

    assert sanitized[1]["role"] == "system"
    assert "tool result dropped" in sanitized[1]["content"]
    assert "call_1" in sanitized[1]["content"]
    assert len(sanitized) == 3
    assert stats["converted"] == 1
