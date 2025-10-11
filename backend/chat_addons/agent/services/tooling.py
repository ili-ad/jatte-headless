"""Utility helpers for translating skills to tool schemas and executions."""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Sequence

from ..skills import Skill


@dataclass
class ToolCall:
    """Representation of a tool call emitted by the LLM."""

    name: str
    arguments: dict[str, Any]


def build_tool_schemas(skills: Sequence[Skill]) -> list[dict[str, Any]]:
    """Return OpenAI-compatible tool schema entries for ``skills``."""

    tools: list[dict[str, Any]] = []
    for skill in skills:
        tools.append(
            {
                "type": "function",
                "function": {
                    "name": skill.name,
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
