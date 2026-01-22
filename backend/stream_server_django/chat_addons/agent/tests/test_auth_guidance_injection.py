from __future__ import annotations

import os
import sys
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

from stream_server_django.chat_addons.agent.services import agent_service as agent_service_module


def test_injects_guidance_when_tools_enabled() -> None:
    messages = [{"role": "user", "content": "Hello"}]

    result = agent_service_module._inject_iliad_auth_guidance(
        messages,
        {"iliad_auth_status", "iliad_auth_nudge_login"},
    )

    assert result[0]["role"] == "system"
    assert "iliad_auth_status" in result[0]["content"]
    assert "iliad_auth_nudge_login" in result[0]["content"]
    assert "status.can_access" in result[0]["content"]


def test_no_guidance_when_missing_tool() -> None:
    messages = [{"role": "user", "content": "Hello"}]

    result = agent_service_module._inject_iliad_auth_guidance(
        messages,
        {"iliad_auth_status"},
    )

    assert result == messages
