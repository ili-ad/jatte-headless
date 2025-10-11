"""Utilities for working with Google Cloud Storage signed uploads."""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Mapping, MutableMapping
from urllib.parse import quote
from urllib.request import Request, urlopen

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey

_SAFE_FILENAME_RE = re.compile(r"[^A-Za-z0-9._-]+")


@dataclass(slots=True)
class ServiceAccount:
    """Minimal subset of service account fields required for signing."""

    client_email: str
    private_key: str

    def build_signer(self) -> RSAPrivateKey:
        """Instantiate an RSA signer for the service account key."""

        return serialization.load_pem_private_key(
            self.private_key.encode("utf-8"), password=None
        )


def load_service_account(raw: str | Mapping[str, str]) -> ServiceAccount:
    """Return a :class:`ServiceAccount` from JSON or mapping data."""

    if isinstance(raw, (str, bytes)):
        data = json.loads(raw)
    else:
        data = dict(raw)
    client_email = data.get("client_email")
    private_key = data.get("private_key")
    if not client_email or not private_key:
        raise ValueError("Service account payload missing required fields")
    return ServiceAccount(client_email=client_email, private_key=private_key)


def safe_filename(name: str) -> str:
    """Return a filesystem-safe filename preserving extensions."""

    candidate = Path(name).name
    sanitized = _SAFE_FILENAME_RE.sub("_", candidate)
    sanitized = sanitized.strip("._") or "file"
    return sanitized


def blob_name_for(attachment_id: str, filename: str) -> str:
    """Return the canonical blob path for an attachment."""

    safe_name = safe_filename(filename)
    return f"attachments/{attachment_id}/{safe_name}"


def _canonical_query(params: Mapping[str, str]) -> str:
    parts = []
    for key in sorted(params.keys()):
        value = params[key]
        parts.append(
            f"{quote(key, safe='')}={quote(value, safe='-_.~')}"
        )
    return "&".join(parts)


def _canonical_headers(headers: Mapping[str, str]) -> tuple[str, str]:
    normalized: MutableMapping[str, str] = {}
    for key, value in headers.items():
        normalized[key.lower()] = " ".join(str(value).strip().split())
    sorted_items = sorted(normalized.items())
    canonical = "".join(f"{k}:{v}\n" for k, v in sorted_items)
    signed_headers = ";".join(k for k, _ in sorted_items)
    return canonical, signed_headers


def generate_signed_url(
    *,
    service_account: ServiceAccount,
    method: str,
    bucket: str,
    blob_name: str,
    expires: timedelta,
    content_type: str | None = None,
    now: datetime | None = None,
    extra_headers: Mapping[str, str] | None = None,
    extra_query: Mapping[str, str] | None = None,
) -> str:
    """Return a V4 signed URL for the given blob."""

    method = method.upper()
    now = now or datetime.now(timezone.utc)
    expiry_seconds = int(expires.total_seconds())
    if expiry_seconds <= 0:
        raise ValueError("expires must be positive")
    datestamp = now.strftime("%Y%m%d")
    timestamp = now.strftime("%Y%m%dT%H%M%SZ")
    credential_scope = f"{datestamp}/auto/storage/goog4_request"
    credential = f"{service_account.client_email}/{credential_scope}"

    headers: dict[str, str] = {"host": "storage.googleapis.com"}
    if content_type:
        headers["content-type"] = content_type
    if extra_headers:
        for key, value in extra_headers.items():
            headers[key.lower()] = value
    canonical_headers, signed_headers = _canonical_headers(headers)

    query: dict[str, str] = {
        "X-Goog-Algorithm": "GOOG4-RSA-SHA256",
        "X-Goog-Credential": credential,
        "X-Goog-Date": timestamp,
        "X-Goog-Expires": str(expiry_seconds),
        "X-Goog-SignedHeaders": signed_headers,
        "X-Goog-Content-SHA256": "UNSIGNED-PAYLOAD",
    }
    if extra_query:
        for key, value in extra_query.items():
            query[key] = value

    canonical_query = _canonical_query(query)
    canonical_uri = f"/{bucket}/{quote(blob_name, safe='/~')}"

    canonical_request = "\n".join(
        [
            method,
            canonical_uri,
            canonical_query,
            canonical_headers,
            signed_headers,
            "UNSIGNED-PAYLOAD",
        ]
    )
    canonical_hash = hashlib.sha256(canonical_request.encode("utf-8")).hexdigest()

    string_to_sign = "\n".join(
        [
            "GOOG4-RSA-SHA256",
            timestamp,
            credential_scope,
            canonical_hash,
        ]
    )

    signer = service_account.build_signer()
    signature = signer.sign(
        string_to_sign.encode("utf-8"),
        padding.PKCS1v15(),
        hashes.SHA256(),
    ).hex()

    query["X-Goog-Signature"] = signature
    final_query = _canonical_query(query)
    return f"https://storage.googleapis.com{canonical_uri}?{final_query}"


def download_blob(url: str, chunk_size: int = 1024 * 1024) -> tuple[str, int]:
    """Download a blob via signed URL and return (sha256_hex, size)."""

    request = Request(url, method="GET")
    hasher = hashlib.sha256()
    total = 0
    with urlopen(request) as response:  # nosec: trusted signed URL
        while True:
            chunk = response.read(chunk_size)
            if not chunk:
                break
            total += len(chunk)
            hasher.update(chunk)
    return hasher.hexdigest(), total
