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
    MessageRepliesView,
    MessageReactionsView,
    MessageFlagView,
    RoomArchiveView,
    RoomUnarchiveView,
    RoomCooldownView,
    ActiveRoomListView,
    RoomDraftView,
    NotificationListView,
    PollOptionCreateView,
    RoomHideView,
    RoomShowView,
    ReactionDetailView,
)

router = DefaultRouter()
# Router is not used here but left for extensibility

urlpatterns = [
    path("api/rooms/", RoomListCreateView.as_view(), name="room-list"),
    path("api/rooms/active/", ActiveRoomListView.as_view(), name="active-rooms"),
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
        "api/rooms/<str:room_uuid>/draft/",
        RoomDraftView.as_view(),
        name="room-draft",
    ),
    path(
        "api/rooms/<str:room_uuid>/config/",
        RoomConfigView.as_view(),
        name="room-config",
    ),
    path(
        "api/rooms/<str:room_uuid>/cooldown/",
        RoomCooldownView.as_view(),
        name="room-cooldown",
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
        "api/rooms/<str:room_uuid>/hide/",
        RoomHideView.as_view(),
        name="room-hide",
    ),
    path(
        "api/rooms/<str:room_uuid>/show/",
        RoomShowView.as_view(),
        name="room-show",
    ),
    path(
        "api/messages/<int:message_id>/",
        MessageDetailView.as_view(),
        name="message-detail",
    ),
    path(
        "api/messages/<int:message_id>/replies/",
        MessageRepliesView.as_view(),
        name="message-replies",
    ),
    path("api/notifications/", NotificationListView.as_view(), name="notifications"),
    path(
        "api/messages/<int:message_id>/reactions/",
        MessageReactionsView.as_view(),
        name="message-reactions",
    ),
    path(
        "api/messages/<int:message_id>/flag/",
        MessageFlagView.as_view(),
        name="message-flag",
    ),      
    path(
        "api/messages/<int:message_id>/reactions/<int:reaction_id>/",
        ReactionDetailView.as_view(),
        name="reaction-detail",
    ),
    path(
        "api/polls/<str:poll_id>/options/",
        PollOptionCreateView.as_view(),
        name="poll-option-create",
    ),
]
