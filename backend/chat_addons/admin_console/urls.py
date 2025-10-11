from django.urls import path

from .views import (
    AdminQueueView,
    ApproveIntakeView,
    ClaimRoomView,
    GatingRulesView,
    IntakeListView,
    RejectIntakeView,
)

urlpatterns = [
    path("queue/", AdminQueueView.as_view(), name="list-admin-queue"),
    path("rooms/<path:cid>/claim/", ClaimRoomView.as_view(), name="claim-room"),
    path("gating-rules/", GatingRulesView.as_view(), name="get-gating-rules"),
    path("intake/", IntakeListView.as_view(), name="list-intake"),
    path(
        "intake/<str:message_id>/approve/",
        ApproveIntakeView.as_view(),
        name="approve-intake",
    ),
    path(
        "intake/<str:message_id>/reject/",
        RejectIntakeView.as_view(),
        name="reject-intake",
    ),
]
