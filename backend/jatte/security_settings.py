"""Validated settings helpers for production deployment boundaries.

Production JATTE requests authenticate with Supabase Bearer JWTs.  Browser
session cookies are not an alternative authentication mechanism for the API.
Keep development-only defaults out of this module: production callers must
explicitly provide every secret and every trusted browser origin.
"""

from __future__ import annotations

import os


class ProductionConfigurationError(RuntimeError):
    """Raised when a production deployment would otherwise start insecurely."""


_PLACEHOLDER_SECRETS = {"", "changeme", "change-me", "django-insecure"}


def required_secret(name: str, environ: dict[str, str] | None = None) -> str:
    """Return a non-placeholder production secret or fail before startup."""

    source = os.environ if environ is None else environ
    value = source.get(name, "").strip()
    if value.lower() in _PLACEHOLDER_SECRETS or value.startswith("django-insecure-"):
        raise ProductionConfigurationError(
            f"{name} must be set to a non-placeholder value in production"
        )
    return value


def required_csv(name: str, environ: dict[str, str] | None = None) -> list[str]:
    """Parse an explicit, non-wildcard production allowlist."""

    source = os.environ if environ is None else environ
    value = source.get(name, "")
    items = [item.strip().rstrip("/") for item in value.split(",") if item.strip()]
    if not items:
        raise ProductionConfigurationError(f"{name} must be configured in production")
    if any(item == "*" or "*" in item for item in items):
        raise ProductionConfigurationError(f"{name} cannot contain wildcard origins")
    return items


def required_value(name: str, environ: dict[str, str] | None = None) -> str:
    """Return an explicitly configured, non-empty production value."""

    source = os.environ if environ is None else environ
    value = source.get(name, "").strip()
    if not value:
        raise ProductionConfigurationError(f"{name} must be configured in production")
    return value
