"""Auth & identity endpoints exposed via the OpenAPI surface."""

# Bindings:
# - connectUser → syncUser → POST /sync-user/
# - disconnectUser → endSession → DELETE /session/
# - refreshToken → refreshToken → GET /refresh-token/
# - currentUser → currentUser → GET /user/
# - wsAuth → wsAuth → GET /ws-auth/
# - getClientId → getClientId → GET /client-id/
# - getConnectionId → getConnectionId → GET /connection-id/

from __future__ import annotations

from typing import Any, Dict

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from stream_server_django.accounts_supabase.views import (
    ClientIDView as LegacyClientIDView,
    CurrentUserView as LegacyCurrentUserView,
    RefreshTokenView as LegacyRefreshTokenView,
    SessionView as LegacySessionView,
    SyncUserView as LegacySyncUserView,
)
from stream_server_django.chat.utils import generate_snowflake
from stream_server_django.common.auth_utils import get_chat_authentication_classes

try:  # pragma: no cover - optional dependency
    import redis
except Exception:  # pragma: no cover - redis is optional in tests
    redis = None


class SyncUserView(LegacySyncUserView):
    """Proxy Supabase sync while returning the OpenAPI shape."""

    authentication_classes = get_chat_authentication_classes()
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        payload: Dict[str, Any] = dict(response.data or {})
        response.data = {
            "id": payload.get("id"),
            "username": payload.get("username"),
        }
        response.status_code = status.HTTP_200_OK
        return response


class SessionView(LegacySessionView):
    """End the authenticated session."""

    authentication_classes = get_chat_authentication_classes()
    permission_classes = [permissions.IsAuthenticated]


class RefreshTokenView(LegacyRefreshTokenView):
    """Return a freshly minted JWT for the caller."""

    authentication_classes = get_chat_authentication_classes()
    permission_classes = [permissions.IsAuthenticated]


class CurrentUserView(LegacyCurrentUserView):
    """Return the minimal user payload required by the shim."""

    authentication_classes = get_chat_authentication_classes()
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        response = super().get(request, *args, **kwargs)
        payload: Dict[str, Any] = dict(response.data or {})
        response.data = {
            "id": payload.get("id"),
            "username": payload.get("username"),
        }
        return response


class WebsocketAuthView(APIView):
    """Authorize websocket usage for authenticated callers."""

    authentication_classes = get_chat_authentication_classes()
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})


class ClientIDView(LegacyClientIDView):
    """Expose the legacy client ID generator on the new surface."""

    authentication_classes = get_chat_authentication_classes()
    permission_classes = [permissions.IsAuthenticated]


class ConnectionIDView(APIView):
    """Return a connection id derived from the session."""

    authentication_classes = get_chat_authentication_classes()
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        cid = request.session.get("connection_id")
        if not cid:
            cid = str(generate_snowflake())
            request.session["connection_id"] = cid

        if redis is not None:
            try:
                client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    decode_responses=True,
                )
                client.set(f"cid:{cid}", request.user.username, ex=60)
            except Exception:
                pass

        return Response({"connection_id": cid})
