from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


def normalize_cid(value: str) -> str:
    value = (value or "").strip()
    if not value:
        raise ValueError("cid is required")
    if ":" not in value:
        value = f"messaging:{value}"
    return value


class Poll(models.Model):
    """A poll scoped to a chat channel."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cid = models.CharField(max_length=255)
    question = models.CharField(max_length=255)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="polls_created",
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at", "-id")
        indexes = [models.Index(fields=["cid", "-created_at", "-id"])]

    def save(self, *args, **kwargs):  # pragma: no cover - normalized via create path
        if self.cid:
            self.cid = normalize_cid(self.cid)
        super().save(*args, **kwargs)


class PollOption(models.Model):
    """Selectable option belonging to a poll."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    poll = models.ForeignKey(Poll, related_name="options", on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="poll_options_created",
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at", "id")


class PollVote(models.Model):
    """Vote cast by a user for a poll option."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    poll = models.ForeignKey(Poll, related_name="votes", on_delete=models.CASCADE)
    option = models.ForeignKey(
        PollOption, related_name="votes", on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="poll_votes",
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("poll", "user")
        ordering = ("-created_at", "-id")
        indexes = [
            models.Index(fields=["poll", "option", "-created_at", "-id"]),
            models.Index(fields=["poll", "user"]),
        ]


class PollAnswer(models.Model):
    """Free-text answer/comment for a poll."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    poll = models.ForeignKey(Poll, related_name="answers", on_delete=models.CASCADE)
    text = models.TextField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="poll_answers",
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at", "-id")
        indexes = [models.Index(fields=["poll", "-created_at", "-id"])]
