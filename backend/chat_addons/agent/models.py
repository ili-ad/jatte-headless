from __future__ import annotations

from decimal import Decimal

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
    """Persisted skill enablement and orchestration policy for a chat room."""

    RECEPTIONIST = "receptionist"
    AUTO_REPLY_OFF = "off"
    AUTO_REPLY_MANUAL = "manual"
    AUTO_REPLY_CHOICES = [
        (RECEPTIONIST, "Receptionist"),
        (AUTO_REPLY_OFF, "Off"),
        (AUTO_REPLY_MANUAL, "Manual"),
    ]

    cid = models.CharField(max_length=255, unique=True)
    agent_enabled = models.BooleanField(default=False)
    enabled_skills = models.JSONField(default=list)
    tool_hop_cap = models.PositiveIntegerField(default=2)
    turn_cap = models.PositiveIntegerField(default=6)
    auto_reply_mode = models.CharField(
        max_length=16,
        choices=AUTO_REPLY_CHOICES,
        default=RECEPTIONIST,
    )
    handoff_message = models.CharField(
        max_length=255,
        default="Let me connect you with a teammate.",
    )
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "chat_addons"
        verbose_name = "Agent room policy"
        verbose_name_plural = "Agent room policies"

    def __str__(self) -> str:  # pragma: no cover - debug helper
        return f"{self.cid} → {sorted(self.enabled_skills)}"


class AgentRun(models.Model):
    """Audit record for an agent invocation."""

    STATUS_OK = "ok"
    STATUS_CAPPED = "capped"
    STATUS_HANDOFF = "handoff"
    STATUS_ERROR = "error"
    STATUS_CHOICES = [
        (STATUS_OK, "Ok"),
        (STATUS_CAPPED, "Capped"),
        (STATUS_HANDOFF, "Handoff"),
        (STATUS_ERROR, "Error"),
    ]

    run_id = models.CharField(max_length=255, unique=True)
    cid = models.CharField(max_length=255)
    user_id = models.CharField(max_length=255, blank=True)
    tools_used = models.JSONField(default=list)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES)
    latency_ms = models.PositiveIntegerField(default=0)
    tokens_in = models.PositiveIntegerField(default=0)
    tokens_out = models.PositiveIntegerField(default=0)
    cost_usd = models.DecimalField(max_digits=10, decimal_places=6, default=Decimal("0"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "chat_addons"
        ordering = ("-created_at", "-id")

    def __str__(self) -> str:  # pragma: no cover - debug helper
        return f"{self.run_id}:{self.status}"


class AgentMemoryEntry(models.Model):
    """Persisted chat memory line for a given conversation id."""

    ROLE_HUMAN = "human"
    ROLE_AGENT = "agent"
    ROLE_SYSTEM = "system"
    ROLE_CHOICES = [
        (ROLE_HUMAN, "Human"),
        (ROLE_AGENT, "Agent"),
        (ROLE_SYSTEM, "System"),
    ]

    cid = models.CharField(max_length=255, db_index=True)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "chat_addons"
        ordering = ("-created_at", "-id")
        verbose_name = "Agent memory entry"
        verbose_name_plural = "Agent memory entries"
        indexes = [
            models.Index(fields=["cid", "-id"], name="agent_memory_cid_id_idx"),
        ]

    def __str__(self) -> str:  # pragma: no cover - debug helper
        preview = (self.text[:30] + "…") if len(self.text) > 30 else self.text
        return f"{self.cid}:{self.role}:{preview}"
