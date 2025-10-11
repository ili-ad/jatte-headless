from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Protocol, runtime_checkable

from django.conf import settings


@runtime_checkable
class AgentService(Protocol):
    """Protocol describing the agent generation surface."""

    def generate(
        self,
        *,
        cid: str,
        prompt: str,
        meta: dict[str, Any] | None = None,
    ) -> str:
        """Return the agent response for ``prompt`` within ``cid``."""


@dataclass
class FauxAgentService:
    """Simple fallback provider used in development and tests."""

    prefix: str = "Agent"

    def generate(
        self,
        *,
        cid: str,
        prompt: str,
        meta: dict[str, Any] | None = None,
    ) -> str:
        suffix = f" ({cid})" if cid else ""
        return f"{self.prefix} reply{suffix}: {prompt}".strip()


_service_override: AgentService | None = None
_default_service: AgentService | None = None


def get_agent_service() -> AgentService:
    """Return the configured agent service instance."""

    if _service_override is not None:
        return _service_override

    global _default_service
    if _default_service is not None:
        return _default_service

    provider = getattr(settings, "CHAT_AGENT_PROVIDER", None) or os.environ.get(
        "AGENT_PROVIDER"
    )
    provider = (provider or "faux").lower()

    if provider == "faux":
        _default_service = FauxAgentService()
        return _default_service

    raise RuntimeError(f"Unknown agent provider: {provider}")


def set_agent_service(service: AgentService | None) -> None:
    """Override the global service instance (primarily for tests)."""

    global _service_override
    _service_override = service
