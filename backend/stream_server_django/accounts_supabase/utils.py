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


def is_at_least_guest_identity(request: Request) -> bool:
    """Return ``True`` when the request includes a valid Supabase JWT identity.

    True for any validated Supabase JWT—either an anonymous session or a logged-in
    user. False when there is no JWT / no authenticated identity on the request.
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
