# accounts/urls.py
from django.urls import path, re_path
from .views import (
    SyncUserView,
    SessionView,
    ClientIDView,
    QueryUsersView,
    UserAgentView,
    CurrentUserView,
)
from .views import RefreshTokenView, DisconnectedView, InitializedView

urlpatterns = [
    path("api/sync-user/", SyncUserView.as_view(), name="sync-user"),
    re_path(r"^api/sync-user/?$", SyncUserView.as_view()),
    path("api/session/", SessionView.as_view(), name="session"),
    re_path(r"^api/session/?$", SessionView.as_view()),
    path("api/client-id/", ClientIDView.as_view(), name="client-id"),
    re_path(r"^api/client-id/?$", ClientIDView.as_view()),
    path("api/users/", QueryUsersView.as_view(), name="query-users"),
    re_path(r"^api/users/?$", QueryUsersView.as_view()),
    path("api/user-agent/", UserAgentView.as_view(), name="user-agent"),
    re_path(r"^api/user-agent/?$", UserAgentView.as_view()),
    path("api/user/", CurrentUserView.as_view(), name="user"),
    re_path(r"^api/user/?$", CurrentUserView.as_view()),
    path("api/refresh-token/", RefreshTokenView.as_view(), name="refresh-token"),
    re_path(r"^api/refresh-token/?$", RefreshTokenView.as_view()),
    path("api/disconnected/", DisconnectedView.as_view(), name="disconnected"),
    re_path(r"^api/disconnected/?$", DisconnectedView.as_view()),
    path("api/initialized/", InitializedView.as_view(), name="initialized"),
    re_path(r"^api/initialized/?$", InitializedView.as_view()),
]
