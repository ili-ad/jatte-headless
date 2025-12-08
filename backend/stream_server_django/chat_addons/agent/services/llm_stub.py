"""Deterministic stub LLM for evaluation harness."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Iterable

from .. import registry
from ..services.llm_client import LLMResult
from ..services.tooling import infer_args_from_text
from ..skills.base import Skill

_STUB_MODEL = "stub-llm"
_STUB_LATENCY_MS = 18
_MEMORY_STORE: dict[str, dict[str, str]] = {}


def reset_stub_memory() -> None:
    """Clear any stored memory between evaluation runs."""

    _MEMORY_STORE.clear()


def _normalize_key(raw: str) -> str:
    trimmed = raw.strip().strip("\"'")
    trimmed = re.sub(r"[?.!]+$", "", trimmed)
    return trimmed.lower()


def _extract_store_values(text: str) -> tuple[str, str]:
    pattern = re.compile(r"remember(?: that)? (?P<key>.+?) is (?P<value>.+)", re.IGNORECASE)
    match = pattern.search(text)
    if match:
        key = _normalize_key(match.group("key"))
        value = match.group("value").strip().strip("\"'")
        value = re.sub(r"[?.!]+$", "", value)
        return key, value
    fallback_key = _normalize_key(text)
    return fallback_key, ""


def _extract_recall_key(text: str) -> str:
    patterns = [
        r"what(?:'s| is) (?P<key>.+)",
        r"who (?:is|was) (?P<key>.+)",
        r"which (?:one )?is (?P<key>.+)",
        r"remember (?P<key>.+)",
        r"recall (?P<key>.+)",
    ]
    lowered = text.lower()
    for raw in patterns:
        match = re.search(raw, lowered, re.IGNORECASE)
        if match:
            return _normalize_key(match.group("key"))
    return _normalize_key(text)


class _EvalMemorySkill(Skill):
    """Base helper for stub memory skills."""

    @property
    def _store(self) -> dict[str, dict[str, str]]:
        return _MEMORY_STORE

    def _bucket(self, ctx: dict[str, Any]) -> dict[str, str]:
        cid = ctx.get("cid") or "default"
        bucket = self._store.setdefault(str(cid), {})
        return bucket


class MemoryStoreSkill(_EvalMemorySkill):
    """Capture simple key/value memories for eval flows."""

    name = "memory.store"
    description = "Store a short fact for later recall."
    input_schema = {"text": {"type": "string"}}
    output_schema = {"stored": "boolean", "key": "string", "value": "string"}

    def can_handle(self, text: str, ctx) -> bool:  # type: ignore[override]
        _ = ctx
        lowered = text.lower()
        return "remember" in lowered and not lowered.strip().startswith("what")

    def execute(self, args: dict[str, Any], ctx) -> dict[str, Any]:  # type: ignore[override]
        text = str(args.get("text") or "")
        key, value = _extract_store_values(text)
        bucket = self._bucket(ctx if isinstance(ctx, dict) else {})
        if key:
            bucket[key] = value
            return {"stored": True, "key": key, "value": value}
        return {"stored": False, "key": key, "value": value}


class MemoryRecallSkill(_EvalMemorySkill):
    """Retrieve stored memories for eval flows."""

    name = "memory.recall"
    description = "Recall a previously stored fact."
    input_schema = {"text": {"type": "string"}}
    output_schema = {"found": "boolean", "key": "string", "value": "string"}

    def can_handle(self, text: str, ctx) -> bool:  # type: ignore[override]
        _ = ctx
        lowered = text.lower()
        has_question = any(token in lowered for token in ("what", "who", "which", "recall"))
        return has_question

    def execute(self, args: dict[str, Any], ctx) -> dict[str, Any]:  # type: ignore[override]
        text = str(args.get("text") or "")
        key = _extract_recall_key(text)
        bucket = self._bucket(ctx if isinstance(ctx, dict) else {})
        value = bucket.get(key, "")
        found = bool(value)
        return {"found": found, "key": key, "value": value}


def _ensure_stub_skills_registered() -> None:
    skills = registry._load_all_skills()  # type: ignore[attr-defined]
    if "memory.store" not in skills:
        skills["memory.store"] = MemoryStoreSkill()
    if "memory.recall" not in skills:
        skills["memory.recall"] = MemoryRecallSkill()


@dataclass(slots=True)
class StubCallContext:
    messages: Iterable[dict[str, Any]]
    tools: list[dict[str, Any]] | None


class LLMStub:
    """Minimal deterministic substitute for orchestration tests."""

    canned_reply = "I'm here and ready to help."

    def __init__(self) -> None:
        _ensure_stub_skills_registered()

    # ------------------------------------------------------------------
    # Public API compatible with :class:`LLMClient`
    # ------------------------------------------------------------------
    def run(
        self,
        messages: Iterable[dict[str, Any]],
        *,
        tools: list[dict[str, Any]] | None = None,
        model: str | None = None,
        max_tokens: int | None = None,
        timeout: int | None = None,
    ) -> LLMResult:
        _ = (model, max_tokens, timeout)
        sequence = list(messages)
        if not sequence:
            return self._result(self.canned_reply)
        last = sequence[-1]
        role = last.get("role")
        if role == "tool":
            reply = self._render_tool_reply(last)
            return self._result(reply)
        text = str(last.get("content") or "")
        skill, args = self._select_skill(text, tools)
        if skill is None:
            return self._result(self.canned_reply)
        payload = {"tool_calls": [{"name": skill.name, "arguments": args}]}
        content = json.dumps(payload, sort_keys=True)
        return self._result(content)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _result(self, content: str) -> LLMResult:
        tokens = max(len(content.split()), 1)
        return LLMResult(
            content=content,
            tokens_used=tokens,
            model=_STUB_MODEL,
            latency_ms=_STUB_LATENCY_MS,
            cost_usd=Decimal("0"),
        )

    def _select_skill(
        self,
        text: str,
        tools: list[dict[str, Any]] | None,
    ) -> tuple[Skill | None, dict[str, Any]]:
        available_names: list[str] = []
        for tool in tools or []:
            function = tool.get("function") if isinstance(tool, dict) else None
            name = str(function.get("name")) if isinstance(function, dict) else ""
            if name:
                available_names.append(name)
        skill_lookup = registry._load_all_skills()  # type: ignore[attr-defined]
        ctx = {"cid": "", "user_id": "", "metadata": {}}
        candidates: list[Skill] = []
        for name in available_names:
            skill = skill_lookup.get(name)
            if not skill:
                continue
            try:
                if skill.can_handle(text, ctx):
                    candidates.append(skill)
            except Exception:
                continue
        if len(candidates) == 1:
            skill = candidates[0]
            if skill.name == "utility.calc":
                args = {"expr": self._extract_math_expr(text)}
            else:
                args = infer_args_from_text(skill, text) or {"text": text}
            return skill, args
        if self._looks_like_math(text) and "utility.calc" in available_names:
            skill = skill_lookup.get("utility.calc")
            if skill is not None:
                args = {"expr": self._extract_math_expr(text)}
                return skill, args
        return None, {}

    def _looks_like_math(self, text: str) -> bool:
        stripped = text.strip()
        if not stripped:
            return False
        has_digit = any(ch.isdigit() for ch in stripped)
        has_operator = any(op in stripped for op in "+-*/")
        return has_digit and has_operator

    def _extract_math_expr(self, text: str) -> str:
        matches = re.findall(r"[0-9+\-*/().]+", text)
        if matches:
            return "".join(matches)
        return text.strip()

    def _render_tool_reply(self, message: dict[str, Any]) -> str:
        name = str(message.get("name") or "")
        payload_raw = message.get("content")
        try:
            payload = json.loads(payload_raw)
        except (TypeError, ValueError):
            payload = {}
        if name == "utility.calc":
            if isinstance(payload, dict):
                if "result" in payload:
                    return str(payload["result"])
                error = payload.get("error", {})
                if isinstance(error, dict) and "message" in error:
                    return str(error["message"])
            return "Could not compute that."
        if name == "memory.store":
            if isinstance(payload, dict) and payload.get("stored"):
                key = payload.get("key") or "that"
                return f"I'll remember {key}."
            return "I wasn't able to remember that."
        if name == "memory.recall":
            if isinstance(payload, dict) and payload.get("found"):
                value = payload.get("value") or ""
                key = payload.get("key") or "it"
                return f"{key.title()} is {value}.".strip()
            return "I don't have that saved."
        return self.canned_reply


__all__ = ["LLMStub", "reset_stub_memory"]
