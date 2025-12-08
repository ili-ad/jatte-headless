"""Configuration helpers for the chat agent runtime."""
from __future__ import annotations

import os
from decimal import Decimal

from django.conf import settings


def _get_env_decimal(name: str, default: str) -> Decimal:
    try:
        return Decimal(
            str(
                getattr(settings, name, None)
                or os.environ.get(name)
                or default
            )
        )
    except Exception:  # pragma: no cover - defensive fallback
        return Decimal(default)


def _get_env_int(name: str, default: int) -> int:
    try:
        return int(
            getattr(settings, name, None) or os.environ.get(name) or default
        )
    except Exception:  # pragma: no cover - defensive fallback
        return int(default)


def _get_env_str(name: str, default: str) -> str:
    return str(
        getattr(settings, name, None)
        or os.environ.get(name)
        or default
    )


def _clamp(value: int, lower: int, upper: int) -> int:
    return max(lower, min(upper, value))


AGENT_MODEL: str = _get_env_str("AGENT_MODEL", "gpt-5-mini")
AGENT_TIMEOUT_SEC: int = _get_env_int("AGENT_TIMEOUT_SEC", 25)
AGENT_STREAMING_TIMEOUT_SEC: int = _get_env_int("AGENT_STREAMING_TIMEOUT_SEC", 240)
AGENT_MAX_TOKENS: int = _get_env_int("AGENT_MAX_TOKENS", 6000)
AGENT_DAILY_BUDGET_USD: Decimal = _get_env_decimal("AGENT_DAILY_BUDGET_USD", "0.50")
AGENT_USER_ID: str = _get_env_str("AGENT_USER_ID", "ai-bot")
MEMORY_MAX_LINES: int = _clamp(_get_env_int("MEMORY_MAX_LINES", 80), 60, 100)
