"""Isolated attachment routes that avoid unrelated optional agent imports."""

from django.urls import path

from stream_server_django.chat.api_views import (
    AttachmentDownloadView,
    AttachmentUploadView,
    CommitAttachmentView,
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
]
