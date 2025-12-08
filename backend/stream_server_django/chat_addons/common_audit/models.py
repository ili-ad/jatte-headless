from __future__ import annotations

from django.db import models


class MessageProvenance(models.Model):
    """Record the provenance of a persisted chat message."""

    class Source(models.TextChoices):
        AGENT = "agent", "Agent"
        HUMAN = "human", "Human"
        SYSTEM = "system", "System"

    message = models.OneToOneField(
        "chat.Message",
        on_delete=models.CASCADE,
        related_name="provenance",
    )
    source = models.CharField(max_length=16, choices=Source.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "stream_server_django.chat_addons"
        verbose_name = "Message provenance"
        verbose_name_plural = "Message provenance"

    def __str__(self) -> str:  # pragma: no cover - representational helper
        return f"{self.message_id}:{self.source}"


class AuditTrail(models.Model):
    """Structured audit trail for administrative actions."""

    class Action(models.TextChoices):
        CLAIM = "claim", "Claim"
        APPROVE = "approve", "Approve intake"
        REJECT = "reject", "Reject intake"
        ESCALATE = "escalate", "Escalate"
        AGENT_ENABLE = "agent_enable", "Enable agent"
        AGENT_DISABLE = "agent_disable", "Disable agent"
        AGENT_INVOKE = "agent_invoke", "Invoke agent"
        SMS_SEND = "sms_send", "Send SMS"

    ts = models.DateTimeField(auto_now_add=True)
    user_id = models.CharField(max_length=255)
    cid = models.CharField(max_length=255, blank=True)
    action = models.CharField(max_length=32, choices=Action.choices)
    target_id = models.CharField(max_length=255, blank=True, null=True)
    request_id = models.CharField(max_length=255)
    meta = models.JSONField(default=dict, blank=True)

    class Meta:
        app_label = "stream_server_django.chat_addons"
        ordering = ("-ts", "-id")
        verbose_name = "Audit trail entry"
        verbose_name_plural = "Audit trail entries"
        indexes = [
            models.Index(fields=["-ts", "-id"]),
            models.Index(fields=["action"]),
        ]

    def __str__(self) -> str:  # pragma: no cover - representational helper
        return f"{self.ts.isoformat()}:{self.action}"
