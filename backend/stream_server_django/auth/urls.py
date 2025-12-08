"""URL configuration for the Auth & Identity OpenAPI surface."""

from django.urls import path, re_path

from .views import (
    ClientIDView,
    ConnectionIDView,
    CurrentUserView,
    RefreshTokenView,
    SessionView,
    SyncUserView,
    WebsocketAuthView,
)

app_name = "auth_api"

urlpatterns = [
    path("sync-user/", SyncUserView.as_view(), name="sync-user"),
    re_path(r"^sync-user/?$", SyncUserView.as_view()),
    path("session/", SessionView.as_view(), name="session"),
    re_path(r"^session/?$", SessionView.as_view()),
    path("refresh-token/", RefreshTokenView.as_view(), name="refresh-token"),
    re_path(r"^refresh-token/?$", RefreshTokenView.as_view()),
    path("user/", CurrentUserView.as_view(), name="user"),
    re_path(r"^user/?$", CurrentUserView.as_view()),
    path("ws-auth/", WebsocketAuthView.as_view(), name="ws-auth"),
    re_path(r"^ws-auth/?$", WebsocketAuthView.as_view()),
    path("client-id/", ClientIDView.as_view(), name="client-id"),
    re_path(r"^client-id/?$", ClientIDView.as_view()),
    path("connection-id/", ConnectionIDView.as_view(), name="connection-id"),
    re_path(r"^connection-id/?$", ConnectionIDView.as_view()),
]
