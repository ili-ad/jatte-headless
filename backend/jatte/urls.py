# backend/jatte/urls.py
from django.contrib import admin
from django.urls import re_path, include, path
from chat import api
from chat.views import TokenView  # real view
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
    path("api/register-subscriptions", api.ok, name="register-subscriptions"),
    path("api/editing-audit-state", api.ok, name="editing-audit-state"),
    path("api/rooms/<str:cid>/draft", api.ok_post, name="room-draft"),
    path("rooms<str:cid>/config/", api.channel_config, name="room-config"),
    path("rooms<str:cid>/messages/", api.messages, name="room-messages"),
    path("rooms<str:cid>/members/", api.members, name="room-members"),
]

# If you want the DEV stub only in DEBUG:
"""
from django.conf import settings
if settings.DEBUG:
    urlpatterns.append(
        re_path(r'^api/token/?$', dev_token, name='token-obtain-dev')
    )
"""
