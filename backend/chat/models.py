from __future__ import annotations

from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Channel(models.Model):
    """Simple chat channel."""

    uuid = models.CharField(max_length=255, unique=True)
    client = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.client} - {self.uuid}"


class Message(models.Model):
    """Message belonging to a channel."""

    ATTACHMENT_SCAN_PENDING = "pending"
    ATTACHMENT_SCAN_CLEAN = "clean"
    ATTACHMENT_SCAN_FLAGGED = "flagged"
    ATTACHMENT_SCAN_ERROR = "error"

    channel = models.ForeignKey(
        Channel, related_name="messages", on_delete=models.CASCADE
    )
    body = models.TextField()
    sent_by = models.CharField(max_length=255)
    custom_data = models.JSONField(default=dict, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    preview = models.JSONField(null=True, blank=True)
    reply_to = models.ForeignKey(
        "self",
        related_name="replies",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
    )
    show_in_channel = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("created_at",)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.sent_by}"

    @staticmethod
    def ensure_attachment_scan_defaults(attachment: dict[str, Any] | None) -> dict[str, Any]:
        """Return ``attachment`` with default scan metadata populated."""

        data: dict[str, Any] = dict(attachment or {})
        status = data.get("scan_status") or Message.ATTACHMENT_SCAN_PENDING
        if status not in {
            Message.ATTACHMENT_SCAN_PENDING,
            Message.ATTACHMENT_SCAN_CLEAN,
            Message.ATTACHMENT_SCAN_FLAGGED,
            Message.ATTACHMENT_SCAN_ERROR,
        }:
            status = Message.ATTACHMENT_SCAN_PENDING
        data["scan_status"] = status
        data.setdefault("scan_label", None)
        return data

    def get_attachment(self, attachment_id: str) -> dict[str, Any] | None:
        """Return a shallow copy of an attachment payload by ``attachment_id``."""

        for attachment in self.attachments or []:
            if attachment.get("id") == attachment_id:
                return dict(attachment)
        return None

    def update_attachment(self, attachment_id: str, **updates: Any) -> dict[str, Any] | None:
        """Update attachment metadata in-place and persist changes."""

        attachments = list(self.attachments or [])
        for index, attachment in enumerate(attachments):
            if attachment.get("id") != attachment_id:
                continue
            new_payload = dict(attachment)
            new_payload.update(updates)
            attachments[index] = new_payload
            self.attachments = attachments
            self.save(update_fields=["attachments", "updated_at"])
            return new_payload
        return None


class ReadState(models.Model):
    """Track the last read timestamp per user per channel."""

    channel = models.ForeignKey(
        Channel, related_name="read_states", on_delete=models.CASCADE
    )
    user = models.CharField(max_length=255)
    last_read = models.DateTimeField()

    class Meta:
        unique_together = ("user", "channel")


class Room(models.Model):
    """Chat room mirroring Stream's channel concept."""

    ACTIVE = "active"
    CLOSED = "closed"

    uuid = models.CharField(max_length=255, unique=True)
    client = models.CharField(max_length=255)
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    url = models.CharField(max_length=255, blank=True, default="")
    data = models.JSONField(null=True, blank=True)
    status = models.CharField(
        max_length=10, choices=[(ACTIVE, "Active"), (CLOSED, "Closed")], default=ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    messages = models.ManyToManyField(Message, related_name="rooms", blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.client} - {self.uuid}"


class Draft(models.Model):
    """Per-user draft message for a room."""

    room = models.ForeignKey(Room, related_name="drafts", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("room", "user")


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)


class Reaction(models.Model):
    message = models.ForeignKey(
        Message, related_name="reactions", on_delete=models.CASCADE
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    type = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)


class Poll(models.Model):
    question = models.CharField(max_length=255)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class PollOption(models.Model):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class PollVote(models.Model):
    poll = models.ForeignKey(
        Poll, related_name="votes", on_delete=models.CASCADE
    )
    option = models.ForeignKey(
        PollOption, related_name="votes", on_delete=models.CASCADE
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]


class Flag(models.Model):
    message = models.ForeignKey(Message, related_name="flags", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class Pin(models.Model):
    message = models.ForeignKey(Message, related_name="pins", on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class UserMute(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mutes"
    )
    target = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="muted_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)


class RoomMute(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class RoomMemberMute(models.Model):
    room = models.ForeignKey(Room, related_name="member_mutes", on_delete=models.CASCADE)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="room_mute_targets",
        on_delete=models.CASCADE,
    )
    muted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="room_mutes_issued",
        on_delete=models.CASCADE,
    )
    muted_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("room", "user")


class Reminder(models.Model):
    room = models.ForeignKey(
        Room, related_name="reminders", on_delete=models.CASCADE, null=True, blank=True
    )
    message = models.ForeignKey(
        Message,
        related_name="reminders",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_reminders",
    )
    note = models.CharField(max_length=255, blank=True, null=True)
    remind_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)


class WebPushSubscription(models.Model):
    """Stored Web Push subscription tied to a specific user."""

    PLATFORM_WEB = "web"
    PLATFORM_IOS = "ios"
    PLATFORM_ANDROID = "android"

    PLATFORM_CHOICES = (
        (PLATFORM_WEB, "Web"),
        (PLATFORM_IOS, "iOS"),
        (PLATFORM_ANDROID, "Android"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="web_push_subscriptions",
        on_delete=models.CASCADE,
    )
    endpoint = models.TextField()
    expiration_time = models.FloatField(null=True, blank=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    client_id = models.CharField(max_length=255, null=True, blank=True)
    platform = models.CharField(
        max_length=20, choices=PLATFORM_CHOICES, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "endpoint")
