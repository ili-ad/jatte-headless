from __future__ import annotations

import os
import sys
import logging
import time
from datetime import datetime
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

from stream_server_django.chat_addons.agent import registry
from stream_server_django.chat_addons.agent.skills.utility.skill import UtilityTimeNowSkill


def _ctx() -> dict:
    return {
        "cid": "messaging:utility",
        "user_id": "user-2",
        "now": timezone.now(),
        "metadata": {"request_id": "req-utility"},
    }


def test_utility_skills_registered() -> None:
    registry.clear_cache()
    names = {meta.name for meta in registry.list_all()}
    assert "utility.time_now" in names
    assert "utility.calc" in names


def test_time_now_can_handle() -> None:
    skill = UtilityTimeNowSkill()
    ctx = _ctx()

    assert skill.can_handle("What time is it?", ctx) is True
    assert skill.can_handle("Tell me the time please", ctx) is True
    assert skill.can_handle("What day is it?", ctx) is False


def test_time_now_returns_iso_and_epoch(caplog: pytest.LogCaptureFixture) -> None:
    skill = UtilityTimeNowSkill()
    ctx = _ctx()

    caplog.clear()
    with caplog.at_level(logging.INFO):
        payload1 = skill.execute({}, ctx)

    iso1 = payload1["iso_utc"]
    epoch1 = payload1["epoch_secs"]

    parsed1 = datetime.fromisoformat(iso1)
    assert parsed1.tzinfo is not None
    assert isinstance(epoch1, float)

    first_records = [record for record in caplog.records if record.skill == skill.name]
    assert len(first_records) == 1
    assert first_records[0].ok is True

    time.sleep(0.01)
    caplog.clear()
    with caplog.at_level(logging.INFO):
        payload2 = skill.execute({}, ctx)

    assert payload2["epoch_secs"] >= epoch1

    records = [record for record in caplog.records if record.skill == skill.name]
    assert len(records) == 1
    record = records[0]
    assert record.request_id == "req-utility"
    assert record.cid == ctx["cid"]
    assert record.ok is True
    assert isinstance(record.latency_ms, int)
