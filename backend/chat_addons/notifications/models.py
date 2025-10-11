from __future__ import annotations

from datetime import datetime

from django.conf import settings
from django.db import models
from django.utils import timezone


class OnCallConfig(models.Model):
    """Store contact information for the on-call destination."""

    phone_e164 = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_oncall_configs",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "On-call configuration"
        verbose_name_plural = "On-call configuration"

    def as_payload(self) -> dict[str, str | None]:
        phone = self.phone_e164.strip() if self.phone_e164 else ""
        email = self.email.strip() if self.email else ""
        return {
            "phone_e164": phone or None,
            "email": email or None,
        }


class AdminPresence(models.Model):
    """Track the most recent activity heartbeat for an administrator."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    last_seen_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=["last_seen_at"]),
        ]

    def touch(self) -> None:
        self.last_seen_at = timezone.now()
        self.save(update_fields=["last_seen_at"])


class EscalationRecord(models.Model):
    """Persist escalations and their delivery status."""

    DELIVERED_SMS = "sms"
    DELIVERED_EMAIL = "email"
    DELIVERED_NONE = "none"
    DELIVERED_CHOICES = [
        (DELIVERED_SMS, "SMS"),
        (DELIVERED_EMAIL, "Email"),
        (DELIVERED_NONE, "None"),
    ]

    cid = models.CharField(max_length=255)
    reason = models.CharField(max_length=255)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_escalations",
    )
    delivered_via = models.CharField(
        max_length=8,
        choices=DELIVERED_CHOICES,
        default=DELIVERED_NONE,
    )
    delivered_at = models.DateTimeField(null=True, blank=True)
    notification = models.ForeignKey(
        "chat.Notification",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="escalations",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["cid", "created_at"]),
        ]
        ordering = ["-created_at", "-id"]

    def mark_delivery(self, via: str, delivered_at: datetime | None = None) -> None:
        self.delivered_via = via
        self.delivered_at = delivered_at
        self.save(update_fields=["delivered_via", "delivered_at"])


__all__ = ["OnCallConfig", "AdminPresence", "EscalationRecord"]
