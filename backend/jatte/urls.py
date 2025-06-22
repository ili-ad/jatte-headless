# backend/jatte/urls.py
from django.contrib import admin
from django.urls import re_path, include, path
from chat import api
from chat.views import TokenView  # real view
from chat.api_views import (
    RoomDraftView,
    RoomConfigView,
    RoomConfigStateView,
    RoomMessagesView,
    RoomMembersCIDView,
)
# from chat.views import dev_token        # <- if you still need the dev stub

urlpatterns = [
    path('', include('accounts_supabase.urls')),
    path('', include('core.urls')),
    path('admin/', admin.site.urls),

    # Canonical API paths have no trailing slash; regex allows the old form.
    re_path(r'^api/token/?$', TokenView.as_view(), name='token-obtain'),
]

urlpatterns += [
    path("api/ws-auth", api.ws_auth, name="ws-auth"),
    path("api/connection-id", api.connection_id, name="connection-id"),
    path("api/register-subscriptions/", api.register_subscriptions, name="register-subscriptions"),
    path("api/editing-audit-state", api.editing_audit_state, name="editing-audit-state"),
    path("api/rooms/<str:room_uuid>/draft/", RoomDraftView.as_view(), name="room-draft"),
    path("api/rooms/<str:cid>/messages/", RoomMessagesView.as_view(), name="room-messages-cid"),
    path("api/rooms/<str:cid>/config/", RoomConfigView.as_view(), name="room-config"),
    path("api/rooms/<str:cid>/members/", RoomMembersCIDView.as_view(), name="room-members-cid"),
    path("api/rooms/<str:room_uuid>/config-state/", RoomConfigStateView.as_view(), name="room-config-state"),
]

# If you want the DEV stub only in DEBUG:
"""
from django.conf import settings
if settings.DEBUG:
    urlpatterns.append(
        re_path(r'^api/token/?$', dev_token, name='token-obtain-dev')
    )
"""
