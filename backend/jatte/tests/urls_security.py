from django.urls import path

from stream_server_django.chat import api
from stream_server_django.chat.views import TokenView


urlpatterns = [
    path("api/token/", TokenView.as_view(), name="token-obtain"),
    path("api/ws-auth/", api.ws_auth, name="ws-auth"),
    path("api/connection-id/", api.connection_id, name="connection-id"),
    path("api/editing-audit-state/", api.editing_audit_state, name="editing-audit-state"),
]
