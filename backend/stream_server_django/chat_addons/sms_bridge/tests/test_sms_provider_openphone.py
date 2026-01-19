from __future__ import annotations

import json
from typing import Any
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from stream_server_django.chat_addons.sms_bridge.services.provider import SmsProviderClient


class _FakeResponse:
    def __init__(self, status: int, body: bytes) -> None:
        self.status = status
        self._body = body

    def read(self) -> bytes:
        return self._body

    def __enter__(self) -> "_FakeResponse":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        return None


class SmsProviderOpenPhoneTests(SimpleTestCase):
    @override_settings(
        SMS_PROVIDER="openphone",
        OPENPHONE_API_KEY="key-123",
        OPENPHONE_FROM_PHONE_ID="phone-456",
        OPENPHONE_BASE_URL="https://api.openphone.com/v1",
    )
    def test_send_openphone_message(self) -> None:
        captured: dict[str, Any] = {}

        def fake_urlopen(req, timeout=0):
            captured["url"] = req.full_url
            captured["headers"] = {key.lower(): value for key, value in req.header_items()}
            captured["body"] = req.data
            body = json.dumps({"data": {"id": "op-123"}}).encode("utf-8")
            return _FakeResponse(200, body)

        client = SmsProviderClient()

        with patch("urllib.request.urlopen", side_effect=fake_urlopen):
            response = client.send("+15551231234", "hi")

        self.assertEqual(response.external_id, "op-123")
        self.assertEqual(captured["url"], "https://api.openphone.com/v1/messages")
        headers = captured["headers"]
        self.assertEqual(headers.get("authorization"), "key-123")
        body = json.loads(captured["body"].decode("utf-8"))
        self.assertEqual(
            body,
            {"content": "hi", "from": "phone-456", "to": ["+15551231234"]},
        )
