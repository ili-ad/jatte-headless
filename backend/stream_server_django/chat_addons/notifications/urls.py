from django.urls import path

from .views import (
    AdminHeartbeatView,
    EscalateRoomView,
    IntakeSummaryView,
    OnCallConfigView,
)


urlpatterns = [
    path("intake/", IntakeSummaryView.as_view(), name="intake-summary"),
    path("oncall/", OnCallConfigView.as_view(), name="notifications-oncall"),
    path("presence/", AdminHeartbeatView.as_view(), name="notifications-presence"),
    path("escalate/", EscalateRoomView.as_view(), name="notifications-escalate"),
]
