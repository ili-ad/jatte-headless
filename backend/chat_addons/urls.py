from django.urls import include, path, re_path
from chat_addons.agent.views import AgentLLMInvokeView, AgentRagView, AgentInvokeView

urlpatterns = [
    path("chat/agent/", include("chat_addons.agent.urls")),
    path("chat/admin/", include("chat_addons.admin_console.urls")),
    path("chat/notifications/", include("chat_addons.notifications.urls")),
    path("chat/integrations/sms/", include("chat_addons.sms_bridge.urls")),


    # API endpoint that Next actually calls:
    re_path(
        r"^api/chat/agent/(?P<cid>.+)/invoke/?$",
        AgentLLMInvokeView.as_view(),
        name="agent-invoke",
    ),

    path(
        "api/chat/agent/rag/",
        AgentRagView.as_view(),
        name="agent-rag",
    ),

    # Optionally keep echo on a dedicated path:
    path(
        "api/chat/agent/<str:cid>/invoke-echo/",
        AgentInvokeView.as_view(),
        name="agent-invoke-echo",
    ),
]
