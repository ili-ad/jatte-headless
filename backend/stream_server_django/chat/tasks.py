"""Background tasks for chat attachments."""

from __future__ import annotations

import logging
from typing import Any, Tuple

try:  # pragma: no cover - Celery optional in some environments
    from celery import shared_task
except ImportError:  # pragma: no cover - fallback for tests without Celery
    from functools import wraps

    def shared_task(*decorator_args, **decorator_kwargs):
        def decorator(func):
            @wraps(func)
            def wrapped(*args, **kwargs):
                return func(*args, **kwargs)

            def delay(*args, **kwargs):
                return func(*args, **kwargs)

            def apply_async(args=None, kwargs=None, **_):
                return func(*(args or ()), **(kwargs or {}))

            wrapped.delay = delay  # type: ignore[attr-defined]
            wrapped.apply_async = apply_async  # type: ignore[attr-defined]
            return wrapped

        if decorator_args and callable(decorator_args[0]) and not decorator_kwargs:
            return decorator(decorator_args[0])
        return decorator

from django.db import transaction
from django.utils import timezone

from .consumers import broadcast_message_update
from .models import Message

logger = logging.getLogger(__name__)


def perform_attachment_scan(attachment: dict[str, Any]) -> Tuple[str, str | None]:
    """Scan ``attachment`` and return (status, label).

    The default implementation assumes all attachments are clean. Tests may
    patch this helper to emulate different verdicts.
    """

    return Message.ATTACHMENT_SCAN_CLEAN, None


def _merge_scan_metadata(
    attachment: dict[str, Any],
    *,
    status: str,
    label: str | None,
    error: str | None,
) -> dict[str, Any]:
    payload = Message.ensure_attachment_scan_defaults(attachment)
    payload["scan_status"] = status
    payload["scan_label"] = label
    payload["scan_at"] = timezone.now().isoformat()
    if error:
        payload["scan_error"] = error
    else:
        payload.pop("scan_error", None)
    return payload


@shared_task
def scan_attachment(message_id: int, attachment_id: str) -> None:
    """Execute a malware scan for an attachment and persist the result."""

    with transaction.atomic():
        try:
            message = Message.objects.select_for_update().get(pk=message_id)
        except Message.DoesNotExist:
            logger.warning("scan_attachment: message %s no longer exists", message_id)
            return

        attachments = list(message.attachments or [])
        target_index = None
        target_payload: dict[str, Any] | None = None
        for index, payload in enumerate(attachments):
            if payload.get("id") == attachment_id:
                target_index = index
                target_payload = dict(payload)
                break

        if target_payload is None or target_index is None:
            logger.warning(
                "scan_attachment: attachment %s missing on message %s",
                attachment_id,
                message_id,
            )
            return

        target_payload = Message.ensure_attachment_scan_defaults(target_payload)

        error: str | None = None
        try:
            status, label = perform_attachment_scan(target_payload)
            if status not in {
                Message.ATTACHMENT_SCAN_CLEAN,
                Message.ATTACHMENT_SCAN_FLAGGED,
            }:
                raise ValueError(f"invalid scan status: {status}")
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.exception("scan_attachment: scan failed for %s", attachment_id)
            status = Message.ATTACHMENT_SCAN_ERROR
            label = None
            error = str(exc)

        updated_payload = _merge_scan_metadata(
            target_payload, status=status, label=label, error=error
        )
        attachments[target_index] = updated_payload
        message.attachments = attachments
        message.save(update_fields=["attachments", "updated_at"])
        message_id = message.id

    try:
        refreshed = Message.objects.get(pk=message_id)
    except Message.DoesNotExist:  # pragma: no cover - message deleted post-save
        return
    broadcast_message_update(refreshed)
