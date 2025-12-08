from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class Reminder(models.Model):
    """Reminder entry owned by a user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="reminders",
        on_delete=models.CASCADE,
    )
    text = models.CharField(max_length=255)
    remind_at = models.DateTimeField()
    cid = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("remind_at", "id")

    def __str__(self) -> str:  # pragma: no cover - human readable only
        return f"Reminder<{self.id}>"
