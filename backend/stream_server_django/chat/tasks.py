"""Background tasks for chat attachments."""

from __future__ import annotations

import logging
from typing import Any

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
from .attachment_scanners import (
    AttachmentScanError,
    ScanRequest,
    ScanResult,
    get_attachment_scanner,
    validate_scan_result,
)
from .attachment_security import sign_attachment_metadata
from .models import Message

logger = logging.getLogger(__name__)


def perform_attachment_scan(attachment: dict[str, Any]) -> ScanResult:
    """Return a real provider verdict for the exact committed pending blob."""

    request = ScanRequest(
        attachment_id=str(attachment.get("id") or ""),
        source_bucket=str(attachment.get("storage_bucket") or ""),
        blob_name=str(attachment.get("blob") or ""),
        expected_sha256=str(attachment.get("sha256") or "").lower(),
        expected_size=int(attachment.get("size") or 0),
        object_generation=(
            str(attachment["object_generation"])
            if attachment.get("object_generation") not in (None, "")
            else None
        ),
    )
    if (
        not request.attachment_id
        or not request.source_bucket
        or not request.blob_name
        or len(request.expected_sha256) != 64
        or request.expected_size <= 0
    ):
        raise AttachmentScanError("attachment scan metadata is incomplete")
    scanner = get_attachment_scanner()
    result = scanner.scan(request)
    validate_scan_result(request, result)
    return result


def _merge_scan_metadata(
    attachment: dict[str, Any],
    *,
    status: str,
    result: ScanResult | None,
    error: str | None,
) -> dict[str, Any]:
    payload = Message.ensure_attachment_scan_defaults(attachment)
    payload["scan_status"] = status
    payload["scan_label"] = result.signature if result else None
    payload["scan_at"] = timezone.now().isoformat()
    if result is not None:
        payload.update(
            {
                "storage_bucket": result.destination_bucket,
                "storage_class": (
                    "clean"
                    if result.verdict == Message.ATTACHMENT_SCAN_CLEAN
                    else "quarantine"
                ),
                "blob": result.destination_blob,
                "object_generation": result.object_generation,
                "scan_engine": result.engine,
                "scan_engine_version": result.engine_version,
                "scan_definition_version": result.definition_version,
                "scan_verified_sha256": result.verified_sha256,
                "scan_verified_size": result.verified_size,
                "scan_provider_at": result.scanned_at,
            }
        )
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
        if target_payload["scan_status"] in {
            Message.ATTACHMENT_SCAN_CLEAN,
            Message.ATTACHMENT_SCAN_FLAGGED,
        }:
            return

        error: str | None = None
        result: ScanResult | None = None
        try:
            result = perform_attachment_scan(target_payload)
            status = result.verdict
        except Exception as exc:
            logger.exception("scan_attachment: scan failed for %s", attachment_id)
            status = Message.ATTACHMENT_SCAN_ERROR
            error = exc.__class__.__name__

        updated_payload = _merge_scan_metadata(
            target_payload, status=status, result=result, error=error
        )
        updated_payload["scan_retry_count"] = int(
            target_payload.get("scan_retry_count") or 0
        ) + 1
        updated_payload["integrity"] = sign_attachment_metadata(updated_payload)
        logger.info(
            "attachment.scan.completed",
            extra={
                "attachment_id": attachment_id,
                "message_id": message.id,
                "room_cids": list(message.rooms.values_list("uuid", flat=True)),
                "uploader_id": target_payload.get("uploaded_by"),
                "sha256": target_payload.get("sha256"),
                "verdict": status,
                "engine_version": (
                    result.engine_version if result is not None else None
                ),
                "definition_version": (
                    result.definition_version if result is not None else None
                ),
                "retry_count": updated_payload["scan_retry_count"],
            },
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
