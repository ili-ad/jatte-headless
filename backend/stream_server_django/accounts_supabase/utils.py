"""Helper utilities for Supabase-backed authentication."""

from __future__ import annotations

from rest_framework.request import Request


def is_at_least_guest_identity(request: Request) -> bool:
    """Return ``True`` when the request includes a valid Supabase JWT identity.

    True for any validated Supabase JWT—either an anonymous session or a logged-in
    user. False when there is no JWT / no authenticated identity on the request.
    """

    # Authentication has already fully validated the token before assigning
    # request.auth. Guest/anonymous Supabase sessions are still valid identities.
    return bool(getattr(request, "auth", None))
