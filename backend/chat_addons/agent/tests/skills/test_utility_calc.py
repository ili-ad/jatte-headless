from __future__ import annotations

import logging
import os
import sys
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

from backend.chat_addons.agent.skills.utility.skill import UtilityCalcSkill


def _ctx() -> dict:
    return {
        "cid": "messaging:calc",
        "user_id": "user-3",
        "now": timezone.now(),
        "metadata": {"request_id": "req-calc"},
    }


def test_calc_can_handle_detection() -> None:
    skill = UtilityCalcSkill()
    ctx = _ctx()

    assert skill.can_handle("What is 2+2?", ctx) is True
    assert skill.can_handle("Add 10 - 3", ctx) is True
    assert skill.can_handle("Tell me a joke", ctx) is False


def test_calc_executes_valid_expression(caplog: pytest.LogCaptureFixture) -> None:
    skill = UtilityCalcSkill()
    ctx = _ctx()

    caplog.clear()
    with caplog.at_level(logging.INFO):
        payload = skill.execute({"expr": "2*(3+4)"}, ctx)

    assert payload == {"result": 14}

    records = [record for record in caplog.records if record.skill == skill.name]
    assert len(records) == 1
    record = records[0]
    assert record.request_id == "req-calc"
    assert record.cid == ctx["cid"]
    assert record.ok is True
    assert isinstance(record.latency_ms, int)


def test_calc_rejects_invalid_input(caplog: pytest.LogCaptureFixture) -> None:
    skill = UtilityCalcSkill()
    ctx = _ctx()

    caplog.clear()
    with caplog.at_level(logging.INFO):
        payload = skill.execute({"expr": "2+bad"}, ctx)

    assert payload == {"error": {"message": "invalid expression"}}

    records = [record for record in caplog.records if record.skill == skill.name]
    assert len(records) == 1
    assert records[0].ok is False


def test_calc_enforces_length_and_charset(caplog: pytest.LogCaptureFixture) -> None:
    skill = UtilityCalcSkill()
    ctx = _ctx()

    long_expr = "1" * 65
    caplog.clear()
    with caplog.at_level(logging.INFO):
        payload_long = skill.execute({"expr": long_expr}, ctx)
    assert payload_long == {"error": {"message": "invalid expression"}}

    caplog.clear()
    with caplog.at_level(logging.INFO):
        payload_chars = skill.execute({"expr": "2+3a"}, ctx)
    assert payload_chars == {"error": {"message": "invalid expression"}}

    records = [record for record in caplog.records if record.skill == skill.name]
    assert len(records) == 1
    assert records[0].ok is False
