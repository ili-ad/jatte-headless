"""Utility helpers for translating skills to tool schemas and executions."""
from __future__ import annotations

import json
import re
import uuid
from dataclasses import dataclass, replace
from typing import Any, Sequence

from ..skills import Skill


@dataclass
class ToolCall:
    """Representation of a tool call emitted by the LLM."""

    name: str
    arguments: dict[str, Any]
    id: str | None = None


def ensure_tool_call_id(tc: ToolCall) -> ToolCall:
    """Return ``tc`` with a stable ``id`` populated."""

    if tc.id:
        return tc
    return replace(tc, id=f"call_{uuid.uuid4().hex}")


_TOOL_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9_-]+$")


def build_tool_schemas(skills: Sequence[Skill]) -> list[dict[str, Any]]:
    """Return OpenAI-compatible tool schema entries for ``skills``."""

    tools: list[dict[str, Any]] = []

    for skill in skills:
        tool_name = getattr(skill, "name", "")
        if not isinstance(tool_name, str) or not tool_name:
            raise ValueError(f"Skill {skill.__class__.__name__} is missing a name")
        if not _TOOL_NAME_PATTERN.fullmatch(tool_name):
            raise ValueError(
                f"Skill {tool_name!r} has invalid name; must match ^[a-zA-Z0-9_-]+$"
            )

        input_schema = getattr(skill, "input_schema", {}) or {}
        if not isinstance(input_schema, dict):
            raise ValueError(f"Skill {tool_name} input_schema must be a dict")
        if input_schema.get("type") != "object":
            raise ValueError(f"Skill {tool_name} input_schema must declare type=object")
        properties = input_schema.get("properties")
        if not isinstance(properties, dict):
            raise ValueError(f"Skill {tool_name} input_schema must include properties dict")

        output_schema = getattr(skill, "output_schema", {}) or {}
        if not isinstance(output_schema, dict):
            raise ValueError(f"Skill {tool_name} output_schema must be a dict")
        if output_schema:
            if output_schema.get("type") != "object":
                raise ValueError(f"Skill {tool_name} output_schema must declare type=object")
            output_properties = output_schema.get("properties")
            if not isinstance(output_properties, dict):
                raise ValueError(
                    f"Skill {tool_name} output_schema must include properties dict"
                )

        setattr(skill, "_tool_name", tool_name)

        tools.append(
            {
                "type": "function",
                "function": {
                    "name": tool_name,
                    "description": skill.description,
                    "parameters": input_schema,
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
            call_id = entry.get("id")
            if not isinstance(call_id, str) or not call_id:
                call_id = None
            arguments = entry.get("arguments", {})
            if isinstance(arguments, str):
                try:
                    arguments = json.loads(arguments)
                except ValueError:
                    arguments = {"input": arguments}
            if not isinstance(arguments, dict):
                arguments = {}
            calls.append(ensure_tool_call_id(ToolCall(name=name, arguments=arguments, id=call_id)))

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
    if not isinstance(schema, dict):
        return {}

    properties = schema.get("properties")
    if not isinstance(properties, dict) or not properties:
        return {}

    # Prefer the first declared string field.
    for key, spec in properties.items():
        if isinstance(spec, dict) and spec.get("type") == "string":
            return {key: text}
    first_key = next(iter(properties.keys()), None)
    if isinstance(first_key, str):
        return {first_key: text}
    return {}


__all__ = [
    "ToolCall",
    "build_tool_schemas",
    "ensure_tool_call_id",
    "infer_args_from_text",
    "parse_tool_instructions",
]
