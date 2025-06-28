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

    channel = models.ForeignKey(
        Channel, related_name="messages", on_delete=models.CASCADE
    )
    body = models.TextField()
    sent_by = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("created_at",)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.sent_by}"


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


class Reminder(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    remind_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
