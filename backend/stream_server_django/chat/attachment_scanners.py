"""Provider-neutral malware scanning boundary for private attachments."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Protocol

from django.conf import settings
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import id_token
import httpx

from .models import Message


class AttachmentScanError(RuntimeError):
    """Raised when no trustworthy scanner verdict is available."""


@dataclass(frozen=True, slots=True)
class ScanRequest:
    attachment_id: str
    source_bucket: str
    blob_name: str
    expected_sha256: str
    expected_size: int
    object_generation: str | None = None


@dataclass(frozen=True, slots=True)
class ScanResult:
    verdict: str
    attachment_id: str
    source_bucket: str
    source_blob: str
    verified_sha256: str
    verified_size: int
    destination_bucket: str
    destination_blob: str
    engine: str
    engine_version: str
    definition_version: str
    scanned_at: str
    source_generation: str
    destination_generation: str
    signature: str | None = None


class AttachmentScanner(Protocol):
    def scan(self, request: ScanRequest) -> ScanResult: ...


def _required_string(payload: dict[str, Any], name: str) -> str:
    value = payload.get(name)
    if not isinstance(value, str) or not value.strip():
        raise AttachmentScanError(f"scanner response missing {name}")
    return value.strip()


class GCPClamAVScanner:
    """Call a private Cloud Run ClamAV service with an ADC identity token."""

    def __init__(self) -> None:
        self.url = str(getattr(settings, "CHAT_ATTACHMENTS_SCANNER_URL", "")).strip()
        self.audience = str(
            getattr(settings, "CHAT_ATTACHMENTS_SCANNER_AUDIENCE", self.url)
        ).strip()
        if not self.url or not self.audience:
            raise AttachmentScanError("scanner endpoint is not configured")

    def scan(self, request: ScanRequest) -> ScanResult:
        try:
            bearer = id_token.fetch_id_token(GoogleAuthRequest(), self.audience)
            timeout = float(
                getattr(settings, "CHAT_ATTACHMENTS_SCANNER_TIMEOUT_SECONDS", 120)
            )
            response = httpx.post(
                self.url,
                json={
                    "attachment_id": request.attachment_id,
                    "source": {
                        "bucket": request.source_bucket,
                        "blob": request.blob_name,
                        "generation": request.object_generation,
                    },
                    "expected": {
                        "sha256": request.expected_sha256,
                        "size": request.expected_size,
                    },
                },
                headers={"Authorization": f"Bearer {bearer}"},
                timeout=max(1.0, timeout),
            )
            response.raise_for_status()
            payload = response.json()
        except (ValueError, httpx.HTTPError) as exc:
            raise AttachmentScanError("scanner request failed") from exc
        except Exception as exc:
            raise AttachmentScanError("scanner authentication failed") from exc

        if not isinstance(payload, dict):
            raise AttachmentScanError("malformed scanner response")
        try:
            verified_size = int(payload.get("verified_size"))
        except (TypeError, ValueError) as exc:
            raise AttachmentScanError("scanner response missing verified_size") from exc
        scanned_at = _required_string(payload, "scanned_at")
        try:
            datetime.fromisoformat(scanned_at.replace("Z", "+00:00"))
        except ValueError as exc:
            raise AttachmentScanError("scanner response has invalid scanned_at") from exc
        verdict = _required_string(payload, "verdict").lower()
        if verdict not in {
            Message.ATTACHMENT_SCAN_CLEAN,
            Message.ATTACHMENT_SCAN_FLAGGED,
        }:
            raise AttachmentScanError("scanner returned an invalid verdict")
        return ScanResult(
            verdict=verdict,
            attachment_id=_required_string(payload, "attachment_id"),
            source_bucket=_required_string(payload, "source_bucket"),
            source_blob=_required_string(payload, "source_blob"),
            verified_sha256=_required_string(payload, "verified_sha256").lower(),
            verified_size=verified_size,
            destination_bucket=_required_string(payload, "destination_bucket"),
            destination_blob=_required_string(payload, "destination_blob"),
            engine=_required_string(payload, "engine"),
            engine_version=_required_string(payload, "engine_version"),
            definition_version=_required_string(payload, "definition_version"),
            scanned_at=scanned_at,
            source_generation=_required_string(payload, "source_generation"),
            destination_generation=_required_string(
                payload, "destination_generation"
            ),
            signature=(
                str(payload["signature"]) if payload.get("signature") else None
            ),
        )


def get_attachment_scanner() -> AttachmentScanner:
    backend = str(
        getattr(settings, "CHAT_ATTACHMENTS_SCANNER_BACKEND", "")
    ).strip()
    if backend == "gcp_clamav":
        return GCPClamAVScanner()
    raise AttachmentScanError("no production attachment scanner is configured")


def validate_scan_result(request: ScanRequest, result: ScanResult) -> None:
    """Bind a scanner verdict to the exact immutable object under review."""

    expected_bucket = (
        settings.CHAT_ATTACHMENTS_CLEAN_BUCKET
        if result.verdict == Message.ATTACHMENT_SCAN_CLEAN
        else settings.CHAT_ATTACHMENTS_QUARANTINE_BUCKET
    )
    mismatched = (
        result.attachment_id != request.attachment_id
        or result.source_bucket != request.source_bucket
        or result.source_blob != request.blob_name
        or result.verified_sha256 != request.expected_sha256.lower()
        or result.verified_size != request.expected_size
        or result.destination_bucket != expected_bucket
        or result.destination_blob != request.blob_name
        or (
            request.object_generation is not None
            and result.source_generation != request.object_generation
        )
        or not result.destination_generation
    )
    if mismatched:
        raise AttachmentScanError("scanner verdict does not match attachment")
