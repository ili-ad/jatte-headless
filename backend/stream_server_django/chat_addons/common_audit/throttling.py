from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any

from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle

DEFAULT_RATES: dict[str, str] = {
    "agent_invoke": "5/min",
    "agent_toggle": "20/min",
    "claim": "20/min",
    "intake_write": "30/min",
    "sms_send": "10/min",
}


def _coerce_mapping(payload: Any) -> dict[str, str]:
    if isinstance(payload, dict):
        return {str(key): str(value) for key, value in payload.items() if value}
    if isinstance(payload, str) and payload.strip():
        try:
            parsed = json.loads(payload)
        except json.JSONDecodeError:
            return {}
        if isinstance(parsed, dict):
            return {str(key): str(value) for key, value in parsed.items() if value}
    return {}


@lru_cache(maxsize=1)
def _rate_limits() -> dict[str, str]:
    """Return the merged rate limit configuration for add-on endpoints."""

    configured = _coerce_mapping(getattr(settings, "ADDON_RATE_LIMITS", None))
    if not configured:
        configured = _coerce_mapping(os.environ.get("ADDON_RATE_LIMITS"))
    merged = dict(DEFAULT_RATES)
    merged.update(configured)
    return merged


def reset_rate_limit_cache() -> None:
    """Clear cached rate limits (primarily for tests)."""

    _rate_limits.cache_clear()


class BaseAddonRateThrottle(SimpleRateThrottle):
    """Throttle requests on a per-user basis with configurable rates."""

    scope: str = ""
    default_rate: str | None = None

    def __init__(self) -> None:
        super().__init__()
        # ``SimpleRateThrottle`` caches the rate during ``__init__``.
        self.rate = self.get_rate()

    def get_cache_key(self, request, view) -> str | None:  # type: ignore[override]
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return None
        identifier = (
            getattr(user, "supabase_uid", None)
            or getattr(user, "username", None)
            or str(getattr(user, "pk", ""))
        )
        if not identifier:
            return None
        return self.cache_format % {"scope": self.scope, "ident": identifier}

    def get_rate(self) -> str | None:  # type: ignore[override]
        limits = _rate_limits()
        return limits.get(self.scope) or self.default_rate


class AgentInvokeRateThrottle(BaseAddonRateThrottle):
    scope = "agent_invoke"
    default_rate = DEFAULT_RATES[scope]


class AgentToggleRateThrottle(BaseAddonRateThrottle):
    scope = "agent_toggle"
    default_rate = "20/min"


class ClaimRoomRateThrottle(BaseAddonRateThrottle):
    scope = "claim"
    default_rate = DEFAULT_RATES[scope]


class IntakeWriteRateThrottle(BaseAddonRateThrottle):
    scope = "intake_write"
    default_rate = DEFAULT_RATES[scope]


class SmsSendRateThrottle(BaseAddonRateThrottle):
    scope = "sms_send"
    default_rate = DEFAULT_RATES[scope]
