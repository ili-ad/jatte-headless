# backend/jatte/urls.py
from django.contrib import admin
from django.urls import re_path, include, path
from stream_server_django.chat import api
from stream_server_django.chat_addons.agent.views import AgentCancelView, AgentLLMInvokeView

from stream_server_django.chat.views import TokenView  # real view
from stream_server_django.chat.views_quoted import QuotedMessageView
from stream_server_django.chat.api_views import (
    RoomConfigView,
    RoomMarkReadView,
    RoomMarkUnreadView,
    RoomMessageListCreateView,
    RoomReadView,
)
#from stream_server_django.chat_addons.agent.views import AgentInvokeView
# from stream_server_django.chat.views import dev_token        # <- if you still need the dev stub

urlpatterns = [
    path("", include("stream_server_django.auth.urls")),
    path("", include("stream_server_django.accounts_supabase.urls")),
    path("", include("stream_server_django.users.urls")),
    path("", include("stream_server_django.core.urls")),
    path("", include("stream_server_django.mutes.urls")),
    path("", include("stream_server_django.rooms.urls")),
    path("", include("stream_server_django.drafts.urls")),
    path("", include("stream_server_django.polls.urls")),
    path("", include("stream_server_django.reminders.urls")),
    path("", include("stream_server_django.events.urls")),
    path("", include("stream_server_django.state.urls")),
    path("", include("stream_server_django.chat_addons.urls")),
    path("quoted-message/", QuotedMessageView.as_view(), name="quoted-message"),
    path("admin/", admin.site.urls),

    # Canonical API paths keep the trailing slash. Regex entries allow the old form.
    path("api/token/", TokenView.as_view(), name="token-obtain"),
    re_path(r"^api/token/?$", TokenView.as_view()),

    # --- Agent invoke (echo) API ---
    # Agent invoke (echo) API — tolerate trailing slash or not
    # re_path(
    #     r"^api/chat/agent/(?P<cid>.+)/invoke/?$",
    #     AgentInvokeView.as_view(),
    #     name="agent-invoke",
    # ),
    # re_path(
    #     r"^api/chat/agent/(?P<cid>.+)/invoke/?$",
    #     AgentLLMInvokeView.as_view(),
    #     name="agent-invoke",
    # ),
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
        "api/rooms/<path:cid>/messages/",
        RoomMessageListCreateView.as_view(),
        name="room-messages-cid",
    ),
    re_path(r"^api/rooms/(?P<cid>.+)/messages/?$", RoomMessageListCreateView.as_view()),
    re_path(
        r"^api/rooms/(?P<room_uuid>[^/]+)/mark_read/?$",
        RoomMarkReadView.as_view(),
        name="room-mark-read",
    ),
    re_path(
        r"^api/rooms/(?P<room_uuid>[^/]+)/mark_unread/?$",
        RoomMarkUnreadView.as_view(),
        name="room-mark-unread",
    ),
    re_path(
        r"^api/rooms/(?P<room_uuid>[^/]+)/read/?$",
        RoomReadView.as_view(),
        name="room-read",
    ),
    path("api/rooms/<path:cid>/config/", RoomConfigView.as_view(), name="room-config"),
    re_path(r"^api/rooms/(?P<cid>.+)/config/?$", RoomConfigView.as_view()),
    path(
        "api/rooms/<path:cid>/agent/cancel/",
        AgentCancelView.as_view(),
        name="agent-cancel",
    ),
    re_path(r"^api/rooms/(?P<cid>.+)/agent/cancel/?$", AgentCancelView.as_view()),
]

# If you want the DEV stub only in DEBUG:
"""
from django.conf import settings
if settings.DEBUG:
    urlpatterns.append(
        re_path(r'^api/token/?$', dev_token, name='token-obtain-dev')
    )
"""
