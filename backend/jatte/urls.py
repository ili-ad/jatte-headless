# backend/jatte/urls.py
from django.contrib import admin
from django.urls import re_path, include, path
from chat import api
from chat.views import TokenView  # real view
from chat.api_views import (
    RoomDraftView,
    RoomConfigView,
    RoomConfigStateView,
    RoomMessageListCreateView,
    RoomMembersCIDView,
)

# from chat.views import dev_token        # <- if you still need the dev stub

urlpatterns = [
    path("", include("accounts_supabase.urls")),
    path("", include("core.urls")),
    path("admin/", admin.site.urls),
    # Canonical API paths keep the trailing slash. Regex entries allow the old form.
    path("api/token/", TokenView.as_view(), name="token-obtain"),
    re_path(r"^api/token/?$", TokenView.as_view()),
]

urlpatterns += [
    path("api/ws-auth/", api.ws_auth, name="ws-auth"),
    re_path(r"^api/ws-auth/?$", api.ws_auth),
    path("api/connection-id/", api.connection_id, name="connection-id"),
    re_path(r"^api/connection-id/?$", api.connection_id),
    path(
        "api/register-subscriptions/",
        api.register_subscriptions,
        name="register-subscriptions",
    ),
    re_path(r"^api/register-subscriptions/?$", api.register_subscriptions),
    path(
        "api/editing-audit-state/", api.editing_audit_state, name="editing-audit-state"
    ),
    re_path(r"^api/editing-audit-state/?$", api.editing_audit_state),
    path(
        "api/rooms/<str:room_uuid>/draft/", RoomDraftView.as_view(), name="room-draft"
    ),
    re_path(r"^api/rooms/(?P<room_uuid>[^/]+)/draft/?$", RoomDraftView.as_view()),
    path(
        "api/rooms/<path:cid>/messages/",
        RoomMessageListCreateView.as_view(),
        name="room-messages-cid",
    ),
    re_path(r"^api/rooms/(?P<cid>.+)/messages/?$", RoomMessageListCreateView.as_view()),
    path("api/rooms/<path:cid>/config/", RoomConfigView.as_view(), name="room-config"),
    re_path(r"^api/rooms/(?P<cid>.+)/config/?$", RoomConfigView.as_view()),
    path(
        "api/rooms/<path:cid>/members/",
        RoomMembersCIDView.as_view(),
        name="room-members-cid",
    ),
    re_path(r"^api/rooms/(?P<cid>.+)/members/?$", RoomMembersCIDView.as_view()),
    path(
        "api/rooms/<str:room_uuid>/config-state/",
        RoomConfigStateView.as_view(),
        name="room-config-state",
    ),
    re_path(
        r"^api/rooms/(?P<room_uuid>[^/]+)/config-state/?$",
        RoomConfigStateView.as_view(),
    ),
]

# If you want the DEV stub only in DEBUG:
"""
from django.conf import settings
if settings.DEBUG:
    urlpatterns.append(
        re_path(r'^api/token/?$', dev_token, name='token-obtain-dev')
    )
"""
