from __future__ import annotations

import os
import sys
import logging
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[5]
BACKEND_DIR = BASE_DIR / "backend"
for path in (BASE_DIR, BACKEND_DIR):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")

import django

django.setup()

import pytest
from django.utils import timezone

from chat_addons.agent import registry
from chat_addons.agent.skills.smalltalk.skill import SmalltalkGreetSkill


def _ctx() -> dict:
    return {
        "cid": "messaging:test-room",
        "user_id": "user-1",
        "now": timezone.now(),
        "metadata": {"request_id": "req-1"},
    }


def test_smalltalk_greet_is_registered() -> None:
    registry.clear_cache()
    metas = registry.list_all()
    assert any(meta.name == "smalltalk.greet" for meta in metas)


def test_smalltalk_greet_can_handle_and_execute(caplog: pytest.LogCaptureFixture) -> None:
    skill = SmalltalkGreetSkill()
    ctx = _ctx()

    assert skill.can_handle("Hello there", ctx) is True
    assert skill.can_handle("hi there", ctx) is True
    assert skill.can_handle("random", ctx) is False

    caplog.clear()
    with caplog.at_level(logging.INFO):
        payload = skill.execute({"name": "Taylor"}, ctx)

    assert payload["text"] == "Hello, Taylor! How can I help today?"

    records = [record for record in caplog.records if record.skill == skill.name]
    assert len(records) == 1
    record = records[0]
    assert record.request_id == "req-1"
    assert record.cid == ctx["cid"]
    assert record.ok is True
    assert isinstance(record.latency_ms, int)


def test_smalltalk_greet_without_name(caplog: pytest.LogCaptureFixture) -> None:
    skill = SmalltalkGreetSkill()
    ctx = _ctx()

    caplog.clear()
    with caplog.at_level(logging.INFO):
        payload = skill.execute({}, ctx)

    assert payload["text"] == "Hello! How can I help today?"
    records = [record for record in caplog.records if record.skill == skill.name]
    assert len(records) == 1
    assert records[0].ok is True
