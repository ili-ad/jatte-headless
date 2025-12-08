"""Evaluation harness runner for stubbed agent conversations."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

try:  # pragma: no cover - optional dependency
    import yaml  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - fallback when PyYAML is absent
    yaml = None

from ..models import AgentRoomPolicy
from ..services.agent_service import AgentService
from ..services.llm_stub import LLMStub, reset_stub_memory

EVALS_DIR = Path(__file__).resolve().parent


@dataclass(slots=True)
class EvalFailure:
    step: int
    reason: str


@dataclass(slots=True)
class EvalResult:
    name: str
    passed: bool
    failures: list[EvalFailure]
    path: Path | None = None


@dataclass(slots=True)
class EvalSpec:
    name: str
    cid: str
    skills: list[str]
    policy: dict[str, Any]
    steps: list[dict[str, Any]]
    path: Path | None = None


class SpecValidationError(ValueError):
    """Raised when a YAML spec is missing required fields."""


def _load_yaml(text: str) -> Any:
    if yaml is not None:  # pragma: no branch - fast path when dependency exists
        return yaml.safe_load(text)
    return _parse_simple_yaml(text)


def _parse_simple_yaml(text: str) -> Any:
    tokens: list[tuple[int, str]] = []
    for raw in text.splitlines():
        stripped = raw.strip()
        if not stripped or stripped.startswith("#"):
            continue
        indent = len(raw) - len(raw.lstrip(" "))
        tokens.append((indent, stripped))
    if not tokens:
        return {}
    value, index = _parse_value(tokens, 0, tokens[0][0])
    if index != len(tokens):  # pragma: no cover - defensive
        raise SpecValidationError("Unexpected trailing content in YAML spec")
    return value


def _parse_value(tokens: list[tuple[int, str]], index: int, indent: int) -> tuple[Any, int]:
    current_indent, content = tokens[index]
    if content.startswith("- "):
        return _parse_list(tokens, index, current_indent)
    if ":" in content:
        return _parse_mapping(tokens, index, current_indent)
    return _parse_scalar(content), index + 1


def _parse_mapping(tokens: list[tuple[int, str]], index: int, indent: int) -> tuple[dict[str, Any], int]:
    mapping: dict[str, Any] = {}
    while index < len(tokens):
        current_indent, content = tokens[index]
        if current_indent < indent:
            break
        if current_indent > indent:
            break
        if ":" not in content:
            raise SpecValidationError(f"Invalid mapping entry: {content}")
        key, rest = content.split(":", 1)
        key = key.strip()
        rest = rest.strip()
        index += 1
        if rest:
            value = _parse_scalar(rest)
        else:
            if index < len(tokens) and tokens[index][0] > current_indent:
                child_indent = tokens[index][0]
                if tokens[index][1].startswith("- "):
                    value, index = _parse_list(tokens, index, child_indent)
                else:
                    value, index = _parse_mapping(tokens, index, child_indent)
            else:
                value = None
        mapping[key] = value
    return mapping, index


def _parse_list(tokens: list[tuple[int, str]], index: int, indent: int) -> tuple[list[Any], int]:
    items: list[Any] = []
    while index < len(tokens):
        current_indent, content = tokens[index]
        if current_indent != indent or not content.startswith("- "):
            break
        item_text = content[2:].strip()
        index += 1
        if item_text and ":" in item_text:
            key, rest = item_text.split(":", 1)
            key = key.strip()
            rest = rest.strip()
            item: dict[str, Any] = {
                key: _parse_scalar(rest) if rest else None
            }
            if index < len(tokens) and tokens[index][0] > indent:
                child_indent = tokens[index][0]
                if tokens[index][1].startswith("- "):
                    nested, index = _parse_list(tokens, index, child_indent)
                else:
                    nested, index = _parse_mapping(tokens, index, child_indent)
                if isinstance(nested, dict):
                    item.update(nested)
                else:
                    item[key] = nested
            items.append(item)
            continue
        if item_text:
            value: Any = _parse_scalar(item_text)
        else:
            value = None
        if index < len(tokens) and tokens[index][0] > indent:
            child_indent = tokens[index][0]
            if tokens[index][1].startswith("- "):
                value, index = _parse_list(tokens, index, child_indent)
            else:
                value, index = _parse_mapping(tokens, index, child_indent)
        items.append(value)
    return items, index


def _parse_scalar(token: str) -> Any:
    lowered = token.lower()
    if lowered in {"true", "yes"}:
        return True
    if lowered in {"false", "no"}:
        return False
    if lowered in {"null", "none"}:
        return None
    if token.startswith("\"") and token.endswith("\""):
        return token[1:-1]
    if token.startswith("'") and token.endswith("'"):
        return token[1:-1]
    try:
        return int(token)
    except ValueError:
        try:
            return float(token)
        except ValueError:
            return token


def load_spec(path: Path) -> EvalSpec:
    """Load and validate a YAML evaluation specification."""

    with path.open("r", encoding="utf-8") as handle:
        data = _load_yaml(handle.read())
    if not isinstance(data, dict):
        raise SpecValidationError(f"Spec at {path} must define a mapping")
    name = str(data.get("name") or path.stem)
    cid = data.get("cid")
    skills = data.get("skills")
    policy = data.get("policy") or {}
    steps = data.get("steps")
    if not isinstance(cid, str) or not cid:
        raise SpecValidationError(f"Spec {name} is missing 'cid'")
    if not isinstance(skills, list) or not all(isinstance(item, str) for item in skills):
        raise SpecValidationError(f"Spec {name} must declare a list of skills")
    if not isinstance(policy, dict):
        raise SpecValidationError(f"Spec {name} policy must be a mapping")
    if not isinstance(steps, list) or not steps:
        raise SpecValidationError(f"Spec {name} must declare at least one step")
    for index, step in enumerate(steps, start=1):
        if not isinstance(step, dict) or "user" not in step:
            raise SpecValidationError(f"Spec {name} step {index} is missing 'user'")
    return EvalSpec(
        name=name,
        cid=str(cid),
        skills=[str(item) for item in skills],
        policy=policy,
        steps=steps,
        path=path,
    )


def discover(pattern: str) -> list[Path]:
    """Return spec paths under :data:`EVALS_DIR` matching ``pattern``."""

    if not pattern:
        pattern = "*"
    return sorted(EVALS_DIR.glob(f"{pattern}.yaml"))


def load_specs(pattern: str) -> list[EvalSpec]:
    """Convenience wrapper returning specs for ``pattern``."""

    return [load_spec(path) for path in discover(pattern)]


def run_specs(specs: Iterable[EvalSpec]) -> list[EvalResult]:
    """Execute ``specs`` sequentially and collect results."""

    results: list[EvalResult] = []
    for spec in specs:
        results.append(run_spec(spec))
    return results


def run_spec(spec: EvalSpec) -> EvalResult:
    """Execute ``spec`` and assert expectations."""

    reset_stub_memory()
    service = AgentService(llm_client=LLMStub())
    policy_defaults = {
        "agent_enabled": True,
        "enabled_skills": spec.skills,
        "tool_hop_cap": int(spec.policy.get("tool_hop_cap", 2)),
        "turn_cap": int(spec.policy.get("turn_cap", 4)),
    }
    if "handoff_message" in spec.policy:
        policy_defaults["handoff_message"] = str(spec.policy["handoff_message"])
    AgentRoomPolicy.objects.update_or_create(cid=spec.cid, defaults=policy_defaults)

    history: list[dict[str, str]] = []
    failures: list[EvalFailure] = []

    for index, step in enumerate(spec.steps, start=1):
        user_text = str(step.get("user") or "")
        expect = step.get("expect") or {}
        meta = {"history": history}
        result = service.simulate(cid=spec.cid, prompt=user_text, meta=meta)
        history.append({"role": "user", "content": user_text})
        history.append({"role": "assistant", "content": result.reply})

        reasons = _evaluate_expectations(expect, result)
        for reason in reasons:
            failures.append(EvalFailure(step=index, reason=reason))

    return EvalResult(name=spec.name, passed=not failures, failures=failures, path=spec.path)


_EXPECTATION_KEYS = {
    "reply_contains",
    "reply_regex",
    "tools_used",
    "status",
    "memory_add",
    "max_latency_ms",
}


def _evaluate_expectations(expect: dict[str, Any], result) -> list[str]:  # type: ignore[no-untyped-def]
    reasons: list[str] = []
    if not isinstance(expect, dict):
        return reasons

    unknown_keys = sorted(set(expect) - _EXPECTATION_KEYS)
    if unknown_keys:
        reasons.append(f"Unexpected expectation keys: {', '.join(unknown_keys)}")

    reply = result.reply
    if "reply_contains" in expect:
        needle = str(expect["reply_contains"])
        if needle not in reply:
            reasons.append(f"reply does not contain '{needle}' (got '{reply}')")

    if "reply_regex" in expect:
        pattern = re.compile(str(expect["reply_regex"]))
        if not pattern.search(reply):
            reasons.append("reply did not match regex expectation")

    if "tools_used" in expect:
        expected_tools = [str(tool) for tool in expect.get("tools_used", [])]
        missing = [tool for tool in expected_tools if tool not in result.tools_used]
        if missing:
            reasons.append(
                "missing expected tools: " + ", ".join(sorted(missing))
            )

    if expect.get("memory_add") and "memory.store" not in result.tools_used:
        reasons.append("memory.store was not invoked for memory_add expectation")

    if "status" in expect:
        status = str(expect["status"])
        if result.status != status:
            reasons.append(f"status expected '{status}' but was '{result.status}'")

    if "max_latency_ms" in expect:
        limit = int(expect["max_latency_ms"])
        if result.latency_ms > limit:
            reasons.append(
                f"latency {result.latency_ms}ms exceeded limit {limit}ms"
            )

    return reasons


def results_to_report(results: Iterable[EvalResult]) -> list[dict[str, Any]]:
    """Serialize :class:`EvalResult` entries for JSON output."""

    report: list[dict[str, Any]] = []
    for result in results:
        report.append(
            {
                "name": result.name,
                "passed": result.passed,
                "failures": [
                    {"step": failure.step, "reason": failure.reason}
                    for failure in result.failures
                ],
                "path": str(result.path) if result.path else None,
            }
        )
    return report


def write_report(results: Iterable[EvalResult], destination: Path) -> None:
    """Write ``results`` to ``destination`` in JSON format."""

    payload = results_to_report(results)
    destination.write_text(json.dumps(payload, indent=2), encoding="utf-8")


__all__ = [
    "EvalFailure",
    "EvalResult",
    "EvalSpec",
    "SpecValidationError",
    "discover",
    "load_spec",
    "load_specs",
    "results_to_report",
    "run_spec",
    "run_specs",
    "write_report",
]
