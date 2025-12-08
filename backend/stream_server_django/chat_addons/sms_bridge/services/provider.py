from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any
from urllib import error, request
from urllib.parse import urljoin

from django.conf import settings


class SmsProviderError(RuntimeError):
    """Raised when the SMS provider request fails."""


@dataclass
class SmsProviderResponse:
    external_id: str


class SmsProviderClient:
    """Simple HTTP client for the external SMS provider."""

    def __init__(self, base_url: str | None = None, token: str | None = None, *, timeout: int = 10):
        self.base_url = (base_url or getattr(settings, "SMS_PROVIDER_BASE_URL", "")).rstrip("/")
        self.token = token or getattr(settings, "SMS_PROVIDER_TOKEN", "")
        self.timeout = timeout

    def send(self, to: str, text: str) -> SmsProviderResponse:
        if not self.base_url or not self.token:
            raise SmsProviderError("SMS provider is not configured")

        payload = json.dumps({"to": to, "text": text}).encode("utf-8")
        url = urljoin(f"{self.base_url}/", "messages")
        req = request.Request(url, data=payload, method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("Authorization", f"Bearer {self.token}")

        try:
            with request.urlopen(req, timeout=self.timeout) as response:
                body = response.read()
                if response.status >= 400:
                    raise SmsProviderError(f"Provider error: {response.status}")
        except error.URLError as exc:  # pragma: no cover - network failure simulated in tests
            raise SmsProviderError("Failed to reach SMS provider") from exc

        try:
            data: dict[str, Any] = json.loads(body.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise SmsProviderError("Invalid provider response") from exc

        external_id = data.get("external_id")
        if not isinstance(external_id, str) or not external_id:
            raise SmsProviderError("Provider response missing external_id")

        return SmsProviderResponse(external_id=external_id)
