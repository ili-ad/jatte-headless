from django.db import models
from django.contrib.auth import get_user_model

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

    channel = models.ForeignKey(Channel, related_name="messages", on_delete=models.CASCADE)
    body = models.TextField()
    sent_by = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

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
