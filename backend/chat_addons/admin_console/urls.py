from django.urls import path

from .views import AdminQueueView, ClaimRoomView

urlpatterns = [
    path("queue/", AdminQueueView.as_view(), name="list-admin-queue"),
    path("rooms/<path:cid>/claim/", ClaimRoomView.as_view(), name="claim-room"),
]
