from django.urls import path
from rest_framework.routers import DefaultRouter
from .api_views import (
    RoomListCreateView,
    RoomDetailView,
    RoomMessageListCreateView,
    RoomMarkReadView,
    RoomMarkUnreadView,
    RoomCountUnreadView,
    RoomLastReadView,
    RoomConfigView,
    MessageDetailView,
    RoomArchiveView,
    RoomUnarchiveView,
)

router = DefaultRouter()
# Router is not used here but left for extensibility

urlpatterns = [
    path("api/rooms/", RoomListCreateView.as_view(), name="room-list"),
    path("api/rooms/<str:uuid>/", RoomDetailView.as_view(), name="room-detail"),
    path(
        "api/rooms/<str:room_uuid>/messages/",
        RoomMessageListCreateView.as_view(),
        name="room-messages",
    ),
    path(
        "api/rooms/<str:room_uuid>/mark_read/",
        RoomMarkReadView.as_view(),
        name="room-mark-read",
    ),
    path(
        "api/rooms/<str:room_uuid>/mark_unread/",
        RoomMarkUnreadView.as_view(),
        name="room-mark-unread",
    ),
    path(
        "api/rooms/<str:room_uuid>/count_unread/",
        RoomCountUnreadView.as_view(),
        name="room-count-unread",
    ),
    path(
        "api/rooms/<str:room_uuid>/last_read/",
        RoomLastReadView.as_view(),
        name="room-last-read",
    ),
    path(
        "api/rooms/<str:room_uuid>/config/",
        RoomConfigView.as_view(),
        name="room-config",
    ),
    path(
        "api/rooms/<str:room_uuid>/archive/",
        RoomArchiveView.as_view(),
        name="room-archive",
    ),
    path(
        "api/rooms/<str:room_uuid>/unarchive/",
        RoomUnarchiveView.as_view(),
        name="room-unarchive",
    ),
    path(
        "api/messages/<int:message_id>/",
        MessageDetailView.as_view(),
        name="message-detail",
    ),
]
