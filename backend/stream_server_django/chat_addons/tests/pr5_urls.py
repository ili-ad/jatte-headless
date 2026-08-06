"""Focused URL configuration for privileged-route authorization tests."""

from django.urls import include, path

from stream_server_django.chat_addons.agent.views import AgentCancelView


urlpatterns = [
    path("", include("stream_server_django.chat_addons.urls")),
    path(
        "api/rooms/<path:cid>/agent/cancel/",
        AgentCancelView.as_view(),
        name="agent-cancel",
    ),
]
