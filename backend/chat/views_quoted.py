"""Quoted message REST endpoints."""

import logging
from typing import Any, Optional

from django.core.cache import cache
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts_supabase.authentication import DevTokenOrJWTAuthentication

LOGGER = logging.getLogger(__name__)
SESSION_KEY = "quoted_message"
CACHE_KEY_TEMPLATE = "quoted:{user_id}"


def _cache_key(user_id: Optional[int]) -> Optional[str]:
    if not user_id:
        return None
    return CACHE_KEY_TEMPLATE.format(user_id=user_id)


def _request_id(request) -> Optional[str]:
    return (
        getattr(request, "request_id", None)
        or request.headers.get("X-Request-ID")
        or request.META.get("HTTP_X_REQUEST_ID")
    )


class QuotedMessageView(APIView):
    """Store and retrieve quoted message state for a user."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def _log(self, request, action: str) -> None:
        LOGGER.info(
            "quoted_message.%s user_id=%s request_id=%s",
            action,
            getattr(request.user, "id", None),
            _request_id(request),
        )

    def get(self, request):
        quoted: Any = request.session.get(SESSION_KEY)
        if quoted is None:
            cache_key = _cache_key(getattr(request.user, "id", None))
            if cache_key:
                quoted = cache.get(cache_key)
        self._log(request, "get")
        return Response({"quoted_message": quoted})

    def post(self, request):
        if "quoted_message" not in request.data:
            return Response(
                {"detail": "quoted_message must be object or null"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        quoted = request.data.get("quoted_message")
        if quoted is not None and not isinstance(quoted, dict):
            return Response(
                {"detail": "quoted_message must be object or null"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cache_key = _cache_key(getattr(request.user, "id", None))

        if quoted is None:
            request.session.pop(SESSION_KEY, None)
            if cache_key:
                cache.delete(cache_key)
            action = "clear"
        else:
            request.session[SESSION_KEY] = quoted
            if cache_key:
                cache.set(cache_key, quoted)
            action = "set"

        self._log(request, action)
        return Response({"status": "ok"})
