from django.urls import path

from .views import (
    AgentDisableView,
    AgentEnableView,
    AgentMemoryListView,
    AgentInvokeView,
    AgentLLMInvokeView,
    AgentPolicyView,
    AgentRagView,
    AgentRunListView,
    AgentSimulateView,
    AgentSkillPolicyView,
    AgentStatusView,
)

urlpatterns = [
    path("policy", AgentPolicyView.as_view(), name="agent-policy"),
    path("skills", AgentSkillPolicyView.as_view(), name="agent-room-skills"),
    path("memory", AgentMemoryListView.as_view(), name="agent-memory"),
    path("rag/", AgentRagView.as_view(), name="agent-rag"),
    path("runs", AgentRunListView.as_view(), name="agent-runs"),
    path("simulate", AgentSimulateView.as_view(), name="agent-simulate"),
    path("<path:cid>/enable/", AgentEnableView.as_view(), name="enable-agent"),
    path("<path:cid>/disable/", AgentDisableView.as_view(), name="disable-agent"),
    #path("<path:cid>/invoke/", AgentInvokeView.as_view(), name="invoke-agent"),

    path(
        "chat/agent/<str:cid>/invoke-echo/",
        AgentInvokeView.as_view(),
        name="agent-invoke-echo",
    ),

    # New default invoke: used by the front-end
    path(
        "chat/agent/<str:cid>/invoke/",
        AgentLLMInvokeView.as_view(),
        name="agent-invoke",
    ),


    path("<path:cid>/", AgentStatusView.as_view(), name="agent-status"),
]
