"""Authentication for explicitly internal chat service routes."""

from __future__ import annotations

import hmac
from dataclasses import dataclass

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


SERVICE_TOKEN_HEADER = "X-Chat-Service-Token"


@dataclass(frozen=True)
class InternalServiceCredentials:
    """Marker stored in ``request.auth`` for service-token requests."""

    service_name: str = "chat-internal-service"


def is_internal_service_request(request) -> bool:
    return isinstance(getattr(request, "auth", None), InternalServiceCredentials)


class InternalServiceAuthentication(BaseAuthentication):
    """Authenticate a service token only on views that opt into this class."""

    def authenticate(self, request):
        supplied = request.headers.get(SERVICE_TOKEN_HEADER)
        if supplied is None:
            return None

        expected = str(getattr(settings, "CHAT_INTERNAL_SERVICE_TOKEN", "") or "")
        if not expected or not hmac.compare_digest(supplied, expected):
            raise AuthenticationFailed("Invalid internal service credentials.")

        username = str(
            getattr(
                settings,
                "CHAT_INTERNAL_SERVICE_USERNAME",
                "__chat_internal_service__",
            )
        ).strip() or "__chat_internal_service__"
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=username,
            defaults={"supabase_uid": f"service:{username}"},
        )
        if created:
            user.set_unusable_password()
            user.save(update_fields=["password"])
        return user, InternalServiceCredentials()

    def authenticate_header(self, request) -> str:
        return SERVICE_TOKEN_HEADER
