"""Utility helpers for translating skills to tool schemas and executions."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Sequence

from ..skills import Skill


@dataclass
class ToolCall:
    """Representation of a tool call emitted by the LLM."""

    name: str
    arguments: dict[str, Any]


_TOOL_NAME_BAD_CHARS = re.compile(r"[^a-zA-Z0-9_-]+")


def _normalize_tool_name(raw: str) -> str:
    """
    OpenAI tool names must match ^[a-zA-Z0-9_-]+$ (no dots).
    We keep skill.name as-is (internal id), but expose a safe tool name.
    """
    candidate = str(raw or "").strip()
    if not candidate:
        return "tool"

    candidate = candidate.replace(".", "_").replace("/", "_")
    candidate = _TOOL_NAME_BAD_CHARS.sub("_", candidate).strip("_")
    if not candidate:
        candidate = "tool"
    if candidate[0].isdigit():
        candidate = f"tool_{candidate}"
    return candidate


def build_tool_schemas(skills: Sequence[Skill]) -> list[dict[str, Any]]:
    """Return OpenAI-compatible tool schema entries for ``skills``."""

    tools: list[dict[str, Any]] = []
    used_names: set[str] = set()

    for skill in skills:
        base = _normalize_tool_name(getattr(skill, "name", "") or "")
        tool_name = base
        i = 2
        while tool_name in used_names:
            tool_name = f"{base}_{i}"
            i += 1
        used_names.add(tool_name)

        # Attach for downstream lookup (agent_service will use this).
        setattr(skill, "_tool_name", tool_name)

        tools.append(
            {
                "type": "function",
                "function": {
                    "name": tool_name,
                    "description": skill.description,
                    "parameters": skill.input_schema or {},
                    "returns": skill.output_schema or {},
                },
            }
        )

    return tools


def parse_tool_instructions(content: str) -> tuple[list[ToolCall], str]:
    """Parse tool calls from ``content`` if present.

    Providers may encode tool usage instructions as JSON in the response body.
    When parsing fails we treat ``content`` as the final reply text.
    """

    if not content:
        return [], ""

    try:
        payload = json.loads(content)
    except (TypeError, ValueError):
        return [], content

    if not isinstance(payload, dict):
        return [], content

    raw_calls = payload.get("tool_calls") or payload.get("tools") or []
    calls: list[ToolCall] = []
    if isinstance(raw_calls, (list, tuple)):
        for entry in raw_calls:
            if not isinstance(entry, dict):
                continue
            name = entry.get("name")
            if not isinstance(name, str) or not name:
                continue
            arguments = entry.get("arguments", {})
            if isinstance(arguments, str):
                try:
                    arguments = json.loads(arguments)
                except ValueError:
                    arguments = {"input": arguments}
            if not isinstance(arguments, dict):
                arguments = {}
            calls.append(ToolCall(name=name, arguments=arguments))

    final_text = payload.get("final") or payload.get("reply")
    if final_text is None:
        final_text = payload.get("content")
    if isinstance(final_text, (dict, list)):
        final_text = json.dumps(final_text)
    if not isinstance(final_text, str):
        final_text = ""

    return calls, final_text


def infer_args_from_text(skill: Skill, text: str) -> dict[str, Any]:
    """Best-effort arguments for fallback execution using ``text``."""

    schema = getattr(skill, "input_schema", {}) or {}
    if not isinstance(schema, dict) or not schema:
        return {}

    # Prefer the first declared string field.
    for key, spec in schema.items():
        if isinstance(spec, dict) and spec.get("type") == "string":
            return {key: text}
    first_key = next(iter(schema.keys()), None)
    if isinstance(first_key, str):
        return {first_key: text}
    return {}


__all__ = ["ToolCall", "build_tool_schemas", "infer_args_from_text", "parse_tool_instructions"]
