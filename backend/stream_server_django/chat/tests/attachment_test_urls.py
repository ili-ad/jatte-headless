"""Isolated attachment routes that avoid unrelated optional agent imports."""

from django.urls import path

from stream_server_django.chat.api_views import (
    AttachmentDownloadView,
    AttachmentUploadView,
    CommitAttachmentView,
    MessageDetailView,
    RoomMessageDetailView,
    RoomMessageListCreateView,
    SignAttachmentView,
)


urlpatterns = [
    path("api/attachments/sign/", SignAttachmentView.as_view(), name="attachments-sign"),
    path("attachments/sign/", SignAttachmentView.as_view(), name="attachments-sign-alias"),
    path(
        "api/attachments/commit/",
        CommitAttachmentView.as_view(),
        name="attachments-commit",
    ),
    path(
        "attachments/commit/",
        CommitAttachmentView.as_view(),
        name="attachments-commit-alias",
    ),
    path("api/attachments/", AttachmentUploadView.as_view(), name="attachments"),
    path("attachments/", AttachmentUploadView.as_view(), name="uploadAttachment"),
    path(
        "api/attachments/<str:attachment_id>/download/",
        AttachmentDownloadView.as_view(),
        name="attachment-download",
    ),
    path(
        "api/rooms/<str:room_uuid>/messages/",
        RoomMessageListCreateView.as_view(),
        name="room-messages",
    ),
    path(
        "api/rooms/<path:cid>/messages/<str:message_id>/",
        RoomMessageDetailView.as_view(),
        name="room-message-delete",
    ),
    path(
        "api/messages/<str:message_id>/",
        MessageDetailView.as_view(),
        name="message-detail",
    ),
]
