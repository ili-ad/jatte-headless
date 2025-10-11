import copy
import json
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[3]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")

import django

django.setup()

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from backend.chat_addons.agent.evals import runner

call_command("migrate", run_syncdb=True, verbosity=0)


def _load_spec(name: str) -> runner.EvalSpec:
    return runner.load_spec(runner.EVALS_DIR / f"{name}.yaml")


def test_calc_simple_spec_passes() -> None:
    spec = _load_spec("calc_simple")
    result = runner.run_spec(spec)
    assert result.passed
    assert result.failures == []


def test_memory_spec_passes() -> None:
    spec = _load_spec("memory_smoke")
    result = runner.run_spec(spec)
    assert result.passed
    assert result.failures == []


def test_runner_detects_expectation_failures() -> None:
    spec = _load_spec("calc_simple")
    bad_steps = copy.deepcopy(spec.steps)
    bad_steps[0]["expect"]["reply_contains"] = "not-present"
    bad_spec = runner.EvalSpec(
        name="calc_simple_failure",
        cid="messaging:eval-calc-failure",
        skills=spec.skills,
        policy=spec.policy,
        steps=bad_steps,
    )

    result = runner.run_spec(bad_spec)
    assert not result.passed
    assert result.failures
    assert any("not-present" in failure.reason for failure in result.failures)


def test_management_command_generates_report(tmp_path: Path) -> None:
    report_path = tmp_path / "eval_report.json"
    call_command("agent_eval", pattern="calc_simple", report=str(report_path))

    data = json.loads(report_path.read_text())
    assert isinstance(data, list)
    assert data[0]["passed"] is True


def test_management_command_nonzero_on_failure(tmp_path: Path) -> None:
    failing_path = runner.EVALS_DIR / "temp_failure.yaml"
    try:
        failing_path.write_text(
            """
name: temp_failure
cid: messaging:eval-temp-failure
skills:
  - utility.calc
policy:
  tool_hop_cap: 1
  turn_cap: 2
steps:
  - user: "What is 1+1?"
    expect:
      reply_contains: "three"
      status: "ok"
""".strip(),
            encoding="utf-8",
        )
        with pytest.raises(CommandError):
            call_command("agent_eval", pattern="temp_failure")
    finally:
        if failing_path.exists():
            failing_path.unlink()
