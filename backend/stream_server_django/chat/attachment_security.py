"""Validation and normalization for attachment metadata persisted on messages."""

from __future__ import annotations

from urllib.parse import quote

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import signing
from django.urls import reverse
from rest_framework import serializers

from stream_server_django.common.identity import ChatIdentity

from .models import Message, Room
from .storage.gcs import safe_filename
from .utils import canonical_cid


ATTACHMENT_SIGNING_SALT = "jatte.chat.attachment-metadata.v1"
_TRUTHY = {"1", "true", "yes", "on"}


def attachments_public_downloads_enabled() -> bool:
    """Return whether attachment metadata may expose storage URLs directly."""

    configured = getattr(settings, "CHAT_ATTACHMENTS_PUBLIC_DOWNLOADS", False)
    if isinstance(configured, str):
        return configured.strip().lower() in _TRUTHY
    return bool(configured)


def public_blob_url(blob_name: str) -> str:
    """Build the configured public-by-link URL for a committed blob."""

    base = getattr(settings, "CHAT_ATTACHMENTS_PUBLIC_BASE_URL", None)
    if base:
        return f"{base.rstrip('/')}/{blob_name}"
    bucket = getattr(settings, "CHAT_ATTACHMENTS_BUCKET", None)
    if bucket:
        return f"https://storage.googleapis.com/{bucket}/{quote(blob_name, safe='/~')}"
    return blob_name


def private_attachment_url(request, attachment_id: str) -> str:
    path = reverse("attachment-download", kwargs={"attachment_id": attachment_id})
    return request.build_absolute_uri(path)


def attachment_download_url(request, attachment_id: str, blob_name: str) -> str:
    if attachments_public_downloads_enabled():
        return public_blob_url(blob_name)
    return private_attachment_url(request, attachment_id)


def attachment_integrity_payload(attachment: dict) -> dict:
    """Return the immutable attachment fields covered by the server HMAC."""

    return {
        "id": str(attachment.get("id") or ""),
        "blob": str(attachment.get("blob") or ""),
        "content_type": str(attachment.get("content_type") or ""),
        "size": int(attachment.get("size") or 0),
        "sha256": str(attachment.get("sha256") or "").lower(),
        "uploaded_by": str(attachment.get("uploaded_by") or ""),
        "message_id": (
            str(attachment["message_id"])
            if attachment.get("message_id") not in (None, "")
            else None
        ),
        "cid": str(attachment.get("cid") or ""),
        "room_uuid": str(attachment.get("room_uuid") or ""),
        "storage_bucket": str(attachment.get("storage_bucket") or ""),
        "storage_class": str(attachment.get("storage_class") or ""),
        "object_generation": (
            str(attachment["object_generation"])
            if attachment.get("object_generation") not in (None, "")
            else None
        ),
    }


def sign_attachment_metadata(attachment: dict) -> str:
    return signing.dumps(
        attachment_integrity_payload(attachment),
        salt=ATTACHMENT_SIGNING_SALT,
        compress=True,
    )


def attachment_integrity_is_valid(
    attachment: dict,
    *,
    room: Room,
    message: Message | None,
    allow_unbound: bool,
) -> bool:
    """Verify immutable metadata and its room/message binding."""

    integrity = attachment.get("integrity")
    if not integrity:
        return False
    try:
        signed_payload = signing.loads(integrity, salt=ATTACHMENT_SIGNING_SALT)
    except signing.BadSignature:
        return False

    try:
        expected = attachment_integrity_payload(attachment)
    except (TypeError, ValueError):
        return False
    if signed_payload != expected:
        return False
    if not all(
        (
            expected["id"],
            expected["blob"],
            expected["content_type"],
            expected["size"] > 0,
            expected["sha256"],
            expected["uploaded_by"],
        )
    ):
        return False
    if expected["cid"] != canonical_cid(None, room_uuid=room.uuid):
        return False
    if expected["room_uuid"] != str(room.uuid):
        return False

    if message is None:
        return allow_unbound and expected["message_id"] is None
    if expected["message_id"] is None:
        return allow_unbound
    return expected["message_id"] == str(message.id)


def _uploader_is_allowed(user, room: Room, uploaded_by: str) -> bool:
    identity = ChatIdentity(user)
    if uploaded_by == str(identity.id):
        return True
    if identity.is_staff or identity.is_superuser or room.agent_id == identity.id:
        return True

    User = get_user_model()
    try:
        uploader = User.objects.filter(pk=uploaded_by).first()
    except (TypeError, ValueError):
        return False
    return bool(
        uploader
        and (
            uploader.is_staff
            or uploader.is_superuser
            or room.agent_id == uploader.id
        )
    )


def _normalize_legacy_placeholder(
    attachment: dict,
    *,
    room: Room,
    user,
    request,
    message: Message | None,
    allow_unbound: bool,
) -> dict:
    """Normalize the explicit, non-downloadable compatibility placeholder."""

    if not attachment.get("legacy_placeholder"):
        raise serializers.ValidationError("Attachment was not server committed.")
    if any(
        attachment.get(field)
        for field in ("blob", "sha256", "content_type", "integrity")
    ):
        raise serializers.ValidationError("Legacy attachment metadata is invalid.")

    attachment_id = str(attachment.get("id") or "").strip()
    raw_name = str(attachment.get("name") or "").strip()
    if not attachment_id or not raw_name:
        raise serializers.ValidationError("Legacy attachment metadata is invalid.")
    name = safe_filename(raw_name)

    expected_url = private_attachment_url(request, attachment_id)
    if str(attachment.get("url") or "") != expected_url:
        raise serializers.ValidationError("Legacy attachment URL is invalid.")

    supplied_message_id = attachment.get("message_id")
    if message is None:
        if supplied_message_id not in (None, "") or not allow_unbound:
            raise serializers.ValidationError("Legacy attachment message is invalid.")
        message_id = None
    else:
        if supplied_message_id not in (None, "", str(message.id)):
            raise serializers.ValidationError("Legacy attachment message is invalid.")
        if supplied_message_id in (None, "") and not allow_unbound:
            raise serializers.ValidationError("Legacy attachment is not message-bound.")
        message_id = str(message.id)

    identity = ChatIdentity(user)
    supplied_uploader = attachment.get("uploaded_by")
    if supplied_uploader not in (None, "", str(identity.id)):
        raise serializers.ValidationError("Legacy attachment uploader is invalid.")

    normalized = {
        "id": attachment_id,
        "name": name,
        "filename": safe_filename(str(attachment.get("filename") or name)),
        "url": expected_url,
        "uploaded_by": str(identity.id),
        "message_id": message_id,
        "cid": canonical_cid(None, room_uuid=room.uuid),
        "room_uuid": str(room.uuid),
        "legacy_placeholder": True,
    }
    if attachment.get("mime_type"):
        normalized["mime_type"] = str(attachment["mime_type"])
    if attachment.get("size") is not None:
        normalized["size"] = int(attachment["size"])
    return Message.ensure_attachment_scan_defaults(normalized)


def validate_attachment_for_message(
    attachment: dict,
    *,
    room: Room,
    user,
    request,
    message: Message | None,
    allow_unbound: bool,
) -> dict:
    """Validate one client-supplied attachment before message persistence."""

    raw = dict(attachment)
    if not raw.get("integrity"):
        return _normalize_legacy_placeholder(
            raw,
            room=room,
            user=user,
            request=request,
            message=message,
            allow_unbound=allow_unbound,
        )

    if not attachment_integrity_is_valid(
        raw, room=room, message=message, allow_unbound=allow_unbound
    ):
        raise serializers.ValidationError("Attachment integrity is invalid.")

    immutable = attachment_integrity_payload(raw)
    if not _uploader_is_allowed(user, room, immutable["uploaded_by"]):
        raise serializers.ValidationError("Attachment uploader is not allowed.")

    expected_url = attachment_download_url(
        request, immutable["id"], immutable["blob"]
    )
    if str(raw.get("url") or "") != expected_url:
        raise serializers.ValidationError("Attachment URL is invalid.")

    normalized = {
        "id": immutable["id"],
        "name": safe_filename(str(raw.get("name") or "file")),
        "filename": safe_filename(
            str(raw.get("filename") or raw.get("name") or "file")
        ),
        "url": expected_url,
        "blob": immutable["blob"],
        "content_type": immutable["content_type"],
        "mime_type": immutable["content_type"],
        "size": immutable["size"],
        "sha256": immutable["sha256"],
        "uploaded_by": immutable["uploaded_by"],
        "message_id": immutable["message_id"],
        "cid": immutable["cid"],
        "room_uuid": immutable["room_uuid"],
        "storage_bucket": immutable["storage_bucket"],
        "storage_class": immutable["storage_class"],
        "object_generation": immutable["object_generation"],
        "integrity": raw["integrity"],
    }

    if message is not None:
        existing = message.get_attachment(immutable["id"])
        if existing and attachment_integrity_is_valid(
            existing, room=room, message=message, allow_unbound=False
        ):
            for key, value in existing.items():
                if key.startswith("scan_") or key in {
                    "blob",
                    "storage_bucket",
                    "storage_class",
                    "object_generation",
                    "integrity",
                }:
                    normalized[key] = value
    return Message.ensure_attachment_scan_defaults(normalized)


def validate_attachments_for_message(
    attachments: list[dict],
    *,
    room: Room,
    user,
    request,
    message: Message | None,
    allow_unbound: bool,
) -> list[dict]:
    """Validate a complete attachment list and reject duplicate IDs."""

    normalized = [
        validate_attachment_for_message(
            attachment,
            room=room,
            user=user,
            request=request,
            message=message,
            allow_unbound=allow_unbound,
        )
        for attachment in attachments
    ]
    ids = [attachment["id"] for attachment in normalized]
    if len(ids) != len(set(ids)):
        raise serializers.ValidationError("Duplicate attachment IDs are not allowed.")
    return normalized


def bind_attachments_to_message(
    attachments: list[dict], *, room: Room, message: Message
) -> list[dict]:
    """Bind pre-message attachments to a newly created message."""

    attachment_ids = {str(attachment["id"]) for attachment in attachments}
    existing_messages = Message.objects.select_for_update().exclude(pk=message.pk)
    for existing in existing_messages.only("attachments"):
        if any(
            str(item.get("id")) in attachment_ids
            for item in (existing.attachments or [])
        ):
            raise serializers.ValidationError(
                "Attachment is already bound to another message."
            )

    bound = []
    for attachment in attachments:
        payload = dict(attachment)
        payload["message_id"] = str(message.id)
        payload["cid"] = canonical_cid(None, room_uuid=room.uuid)
        payload["room_uuid"] = str(room.uuid)
        if payload.get("legacy_placeholder"):
            payload.pop("integrity", None)
        else:
            payload["integrity"] = sign_attachment_metadata(payload)
        bound.append(Message.ensure_attachment_scan_defaults(payload))
    return bound
