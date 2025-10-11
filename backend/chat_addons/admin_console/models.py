from __future__ import annotations

from django.conf import settings
from django.db import models


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
        app_label = "chat_addons"
        verbose_name = "Room ownership"
        verbose_name_plural = "Room ownership"

    def __str__(self) -> str:  # pragma: no cover - representation helper
        owner_identifier = getattr(self.owner, "supabase_uid", None) or (
            str(self.owner_id) if self.owner_id else "unassigned"
        )
        return f"{self.room.uuid} → {owner_identifier}"
