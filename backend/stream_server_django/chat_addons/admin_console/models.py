from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone


class RoomOwnership(models.Model):
    """Ownership metadata for chat rooms managed by the admin console."""

    room = models.OneToOneField(
        "chat.Room",
        on_delete=models.CASCADE,
        related_name="ownership",
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="owned_rooms",
    )
    claimed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = "stream_server_django.chat_addons"
        verbose_name = "Room ownership"
        verbose_name_plural = "Room ownership"

    def __str__(self) -> str:  # pragma: no cover - representation helper
        owner_identifier = getattr(self.owner, "supabase_uid", None) or (
            str(self.owner_id) if self.owner_id else "unassigned"
        )
        return f"{self.room.uuid} → {owner_identifier}"


class GatingConfig(models.Model):
    """Persist moderation gating configuration for intake decisions."""

    DEFAULT_SLUG = "default"

    slug = models.CharField(max_length=64, unique=True, default=DEFAULT_SLUG)
    languages = models.JSONField(default=list, blank=True)
    min_length = models.PositiveIntegerField(default=1)
    max_length = models.PositiveIntegerField(default=1000)
    min_interval_seconds = models.PositiveIntegerField(default=5)
    blocklist = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "stream_server_django.chat_addons"
        verbose_name = "Gating configuration"
        verbose_name_plural = "Gating configurations"

    def __str__(self) -> str:  # pragma: no cover - representation helper
        return f"GatingConfig<{self.slug}>"


class MessageIntake(models.Model):
    """Track moderation status for first messages held for review."""

    STATUS_PENDING = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    )

    message = models.OneToOneField(
        "chat.Message",
        on_delete=models.CASCADE,
        related_name="intake",
    )
    cid = models.CharField(max_length=255)
    user_id = models.CharField(max_length=255)
    text = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    reason = models.CharField(max_length=255, blank=True, null=True)
    muted = models.BooleanField(default=False)
    initial_broadcast = models.BooleanField(default=False)
    decided_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "stream_server_django.chat_addons"
        ordering = ("-created_at",)
        verbose_name = "Message intake"
        verbose_name_plural = "Message intakes"

    def mark_approved(self, *, initial_broadcast: bool | None = None) -> None:
        self.status = self.STATUS_APPROVED
        self.reason = None
        self.decided_at = timezone.now()
        update_fields = ["status", "reason", "decided_at", "updated_at"]
        if initial_broadcast is not None:
            self.initial_broadcast = initial_broadcast
            update_fields.append("initial_broadcast")
        self.save(update_fields=update_fields)

    def mark_rejected(self, *, reason: str | None = None, muted: bool = False) -> None:
        self.status = self.STATUS_REJECTED
        self.reason = reason
        self.muted = muted
        self.decided_at = timezone.now()
        self.save(
            update_fields=[
                "status",
                "reason",
                "muted",
                "decided_at",
                "updated_at",
            ]
        )
