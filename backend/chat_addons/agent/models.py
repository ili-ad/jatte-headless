from __future__ import annotations

from decimal import Decimal

from django.db import models





from pgvector.django import VectorField

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






class DocumentChunk(models.Model):
    """
    A single retrievable chunk of a source document used for RAG.

    For now we assume all chunks are Florida lien-law text, but we keep
    `state` and `topic` to future-proof for other jurisdictions and domains.
    """

    # High-level context
    state = models.CharField(max_length=8, db_index=True)  # e.g. "FL"
    topic = models.CharField(
        max_length=128,
        db_index=True,
        help_text="Short slug for the pillar/topic, e.g. 'noc_compliance', 'lien_waiver'.",
    )

    # Document identity
    doc_name = models.CharField(
        max_length=256,
        help_text="Source document name, e.g. 'florida_noc_compliance.md'.",
    )
    chunk_index = models.PositiveIntegerField(
        help_text="Zero-based index for this chunk within its document."
    )

    # Content
    heading = models.TextField(
        blank=True,
        help_text="Section heading(s) associated with this chunk.",
    )
    text = models.TextField(
        help_text="The full text of this chunk that will be retrieved & shown to the LLM.",
    )

    # Simple metadata for debugging / analysis
    tokens_estimated = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Approximate token count for this chunk (heuristic).",
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        help_text="Optional extra metadata (statute refs, phase, etc.).",
    )

    # Embedding to be filled later by a separate command.
    # text-embedding-3-small is 1536-dim, so we pick 1536 here.
    embedding = VectorField(
        dimensions=1536,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("state", "doc_name", "chunk_index")
        indexes = [
            models.Index(fields=["state", "topic"]),
        ]

    def __str__(self) -> str:
        return f"{self.state}:{self.topic} [{self.doc_name} #{self.chunk_index}]"
