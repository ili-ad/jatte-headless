from __future__ import annotations

from typing import Iterable, Sequence

from django.conf import settings
from django.core.mail import send_mail

from chat.models import Notification

from chat_addons.sms_bridge.services.provider import SmsProviderClient, SmsProviderError


class NotificationService:
    """Helpers for dispatching escalation alerts."""

    def __init__(
        self,
        *,
        sms_client: SmsProviderClient | None = None,
        email_sender: callable | None = None,
    ) -> None:
        self.sms_client = sms_client or SmsProviderClient()
        self._email_sender = email_sender or send_mail

    def send_sms(self, to: str, text: str) -> None:
        """Send an SMS using the shared provider client."""

        self.sms_client.send(to=to, text=text)

    def send_email(self, to_email: str, subject: str, body: str) -> None:
        """Send an email alert using Django's mail helpers."""

        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@example.com")
        self._email_sender(subject, body, from_email, [to_email])

    def create_notification_item(
        self, *, text: str, users: Iterable[settings.AUTH_USER_MODEL]
    ) -> Sequence[Notification]:
        """Create feed notifications for the supplied users."""

        notifications: list[Notification] = []
        seen_ids: set[int] = set()
        truncated = text[:255]
        for user in users:
            if not user:
                continue
            user_id = getattr(user, "pk", None)
            if user_id is None or user_id in seen_ids:
                continue
            seen_ids.add(user_id)
            notifications.append(Notification.objects.create(user=user, text=truncated))
        return notifications


__all__ = ["NotificationService", "SmsProviderError"]
