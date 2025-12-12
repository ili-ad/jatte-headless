"""Helper utilities for Supabase-backed authentication."""

from __future__ import annotations

import jwt
from jwt import PyJWTError
from rest_framework.request import Request


def _decode_unverified(token: str) -> dict:
    try:
        return jwt.decode(token, options={"verify_signature": False, "verify_aud": False})
    except PyJWTError:
        return {}


def is_guest_identity(request: Request) -> bool:
    """Return ``True`` when the authenticated request represents a guest session.

    Supabase anonymous sessions typically include markers like ``is_anonymous`` or
    an ``app_metadata.provider`` of ``"anonymous"``. We attempt to detect those
    claims without re-verifying the JWT signature (the DRF authentication class
    has already validated the token). If no explicit marker is present, we treat
    any validated Supabase JWT as at least a guest for the limited read-only
    access granted by the config-state endpoint.
    """

    token = getattr(request, "auth", None)
    if not token:
        return False

    if not isinstance(token, str):
        return True

    claims = _decode_unverified(token)

    app_metadata = claims.get("app_metadata")
    if isinstance(app_metadata, dict) and app_metadata.get("provider") == "anonymous":
        return True

    for key in ("is_anonymous", "is_anonymous_session", "is_anonymous_user"):
        if claims.get(key) is True:
            return True

    amr = claims.get("amr")
    if isinstance(amr, (list, tuple)) and "anonymous" in amr:
        return True

    return True
