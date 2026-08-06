"""Fail-closed authentication for SMS provider callbacks."""

from __future__ import annotations

import base64
import hmac
from hashlib import sha256

from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import APIException, PermissionDenied


class SmsWebhookNotConfigured(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Webhook secret not configured"


class SmsWebhookReplay(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Webhook event already processed"


def sms_provider_signature(secret: str, payload: bytes) -> str:
    """Return the configured provider-v1 HMAC for the exact raw body."""

    encoded = base64.b64encode(payload)
    return hmac.new(secret.encode("utf-8"), encoded, sha256).hexdigest()


def verify_sms_provider_signature(request) -> None:
    """Require a valid ``X-Signature`` over the unmodified request body.

    The provider contract available in this repository does not include a
    signed timestamp. Replay protection is therefore enforced with the
    provider's unique external event/message identifier after JSON validation.
    """

    secret = str(getattr(settings, "SMS_WEBHOOK_SECRET", "") or "")
    if not secret:
        raise SmsWebhookNotConfigured()

    supplied = request.headers.get("X-Signature", "")
    expected = sms_provider_signature(secret, request.body or b"")
    if not supplied or not hmac.compare_digest(supplied.lower(), expected.lower()):
        raise PermissionDenied("Invalid webhook signature")
