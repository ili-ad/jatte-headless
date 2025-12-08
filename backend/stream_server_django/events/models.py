"""Database models for the events domain."""

from django.conf import settings
from django.db import models


class EventSubscription(models.Model):
    """Store the raw subscription payload for a given user."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_subscriptions",
    )
    subscriptions = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user",)

    def __str__(self) -> str:  # pragma: no cover
        return f"Subscriptions for {self.user_id}"


class EventNotification(models.Model):
    """Persist dispatched events for later retrieval."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_notifications",
    )
    event_type = models.CharField(max_length=255)
    payload = models.JSONField(default=dict, blank=True)
    cid = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at", "-id")

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.event_type} for {self.user_id}"
