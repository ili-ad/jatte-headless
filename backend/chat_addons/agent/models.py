from __future__ import annotations

from django.db import models


class RoomAgentFlag(models.Model):
    """Toggle state for the chat agent on a per-room basis."""

    room = models.OneToOneField(
        "chat.Room",
        on_delete=models.CASCADE,
        related_name="agent_flag",
    )
    agent_enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "chat_addons"
        verbose_name = "Agent room flag"
        verbose_name_plural = "Agent room flags"

    def __str__(self) -> str:  # pragma: no cover - debug helper
        return f"{self.room.uuid} → {'enabled' if self.agent_enabled else 'disabled'}"


class AgentRoomPolicy(models.Model):
    """Persisted skill enablement state for a chat room."""

    cid = models.CharField(max_length=255, unique=True)
    agent_enabled = models.BooleanField(default=False)
    enabled_skills = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "chat_addons"
        verbose_name = "Agent room policy"
        verbose_name_plural = "Agent room policies"

    def __str__(self) -> str:  # pragma: no cover - debug helper
        return f"{self.cid} → {sorted(self.enabled_skills)}"
