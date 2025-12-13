"""Host-friendly URL pack for chat bootstrap + core chat operations.

This module groups the endpoints used by ChatProvider bootstrap helpers
(`getChatCreds`, `ChatClient.connectUser`, etc.) so a downstream Django project
can include them with a single `include()` without installing optional apps.
"""

from django.urls import include, path, re_path

from stream_server_django.accounts_supabase.views import (
    ClientIDView,
    SessionView,
    SyncUserView,
)
from stream_server_django.auth.views import WebsocketAuthView
from stream_server_django.chat.api_views import ConnectionIDView, WsAuthView as LegacyWsAuthView
from stream_server_django.chat.views import TokenView


urlpatterns = [
    path("api/token/", TokenView.as_view(), name="token-obtain"),
    re_path(r"^api/token/?$", TokenView.as_view()),
    path("api/client-id/", ClientIDView.as_view(), name="client-id"),
    re_path(r"^api/client-id/?$", ClientIDView.as_view()),
    path("api/sync-user/", SyncUserView.as_view(), name="sync-user"),
    re_path(r"^api/sync-user/?$", SyncUserView.as_view()),
    path("api/session/", SessionView.as_view(), name="session"),
    re_path(r"^api/session/?$", SessionView.as_view()),
    path("api/ws-auth/", LegacyWsAuthView.as_view(), name="ws-auth"),
    re_path(r"^api/ws-auth/?$", LegacyWsAuthView.as_view()),
    path("api/connection-id/", ConnectionIDView.as_view(), name="connection-id"),
    re_path(r"^api/connection-id/?$", ConnectionIDView.as_view()),
    path("api/ws-auth/live/", WebsocketAuthView.as_view(), name="ws-auth-live"),
    re_path(r"^api/ws-auth/live/?$", WebsocketAuthView.as_view()),
]


urlpatterns += [
    path("", include("stream_server_django.chat.urls")),
    path("", include("stream_server_django.accounts_supabase.urls")),
    path("", include("stream_server_django.auth.urls")),
    path("", include("stream_server_django.chat_addons.urls")),
    path("", include("stream_server_django.core.urls")),
]
