from __future__ import annotations

from django.db import models
from django.utils import timezone


class SmsRoomLink(models.Model):
    """Map a chat ``cid`` to an external SMS phone number."""

    cid = models.CharField(max_length=255)
    phone_e164 = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("cid", "phone_e164")
        indexes = [
            models.Index(fields=["phone_e164"]),
        ]

    def touch(self) -> None:
        self.last_seen_at = timezone.now()
        self.save(update_fields=["last_seen_at"])


class SmsRelay(models.Model):
    """Track inbound and outbound SMS relay attempts."""

    DIRECTION_INBOUND = "inbound"
    DIRECTION_OUTBOUND = "outbound"
    DIRECTION_CHOICES = [
        (DIRECTION_INBOUND, "Inbound"),
        (DIRECTION_OUTBOUND, "Outbound"),
    ]

    STATUS_PENDING = "pending"
    STATUS_DELIVERED = "delivered"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_DELIVERED, "Delivered"),
        (STATUS_FAILED, "Failed"),
    ]

    cid = models.CharField(max_length=255)
    direction = models.CharField(max_length=8, choices=DIRECTION_CHOICES)
    external_id = models.CharField(max_length=128)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES)
    message_id = models.CharField(max_length=64, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("direction", "external_id")
        indexes = [
            models.Index(fields=["external_id", "direction"]),
        ]

    def mark_status(self, status: str) -> None:
        self.status = status
        self.save(update_fields=["status"])
