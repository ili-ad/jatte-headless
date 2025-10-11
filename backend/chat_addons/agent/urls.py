from django.urls import path

from .views import (
    AgentDisableView,
    AgentEnableView,
    AgentInvokeView,
    AgentPolicyView,
    AgentSkillPolicyView,
    AgentStatusView,
)

urlpatterns = [
    path("policy", AgentPolicyView.as_view(), name="agent-policy"),
    path("skills", AgentSkillPolicyView.as_view(), name="agent-room-skills"),
    path("<path:cid>/enable/", AgentEnableView.as_view(), name="enable-agent"),
    path("<path:cid>/disable/", AgentDisableView.as_view(), name="disable-agent"),
    path("<path:cid>/invoke/", AgentInvokeView.as_view(), name="invoke-agent"),
    path("<path:cid>/", AgentStatusView.as_view(), name="agent-status"),
]
