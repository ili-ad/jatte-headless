from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, ClassVar

from .context import ConversationCtx


class Skill(ABC):
    """Base interface all agent skills must implement."""

    #: Unique identifier for the skill, e.g. ``"shipping.quote"``.
    name: ClassVar[str]
    #: Human readable description surfaced to operators.
    description: ClassVar[str]
    #: JSON-serialisable schema describing expected input.
    input_schema: ClassVar[dict[str, Any]]
    #: JSON-serialisable schema describing the output payload.
    output_schema: ClassVar[dict[str, Any]]
    #: Whether the skill should be enabled for new rooms by default.
    enabled_by_default: ClassVar[bool] = False

    @abstractmethod
    def can_handle(self, text: str, ctx: ConversationCtx) -> bool:
        """Return ``True`` when the skill can answer ``text`` in ``ctx``."""

    @abstractmethod
    def execute(self, args: dict[str, Any], ctx: ConversationCtx) -> dict[str, Any]:
        """Execute the skill with ``args`` under ``ctx`` and return a payload."""
