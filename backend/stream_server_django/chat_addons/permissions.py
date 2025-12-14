from __future__ import annotations

from rest_framework.permissions import BasePermission
from stream_server_django.common.identity import get_chat_identity


class IsChatStaff(BasePermission):
    """
    Require staff/superuser privileges for chat ops endpoints.

    Works with both:
    - normal Django users (request.user is AUTH_USER_MODEL)
    - principal-backed identities (request.user is a principal; identity.as_user() materializes a user)
    """

    message = "Staff privileges required."

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        identity = get_chat_identity(request)

        # Fast path (works when request.user already carries staff flags)
        if identity.is_staff or identity.is_superuser:
            return True

        # Principal-backed path: materialize the user row and check DB flags
        try:
            user = identity.as_user()
        except Exception:
            return False

        return bool(getattr(user, "is_staff", False) or getattr(user, "is_superuser", False))
