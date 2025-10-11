from __future__ import annotations

from django.conf import settings
from django.core.cache import caches
from django.core.cache.backends.base import InvalidCacheBackendError
from rest_framework.throttling import SimpleRateThrottle


class ConfigurableUserRateThrottle(SimpleRateThrottle):
    """SimpleRateThrottle that reads its rate from Django settings.

    The throttle is keyed per authenticated user, falling back to the
    request's IP address when unauthenticated. Results are stored in the
    dedicated ``throttles`` cache so we can back it with Redis in production
    while keeping tests fast with a local cache backend.
    """

    cache_name = "throttles"
    rate_setting_name: str | None = None

    def __init__(self) -> None:
        try:
            cache = caches[self.cache_name]
        except InvalidCacheBackendError:
            cache = caches["default"]
        self.cache = cache
        super().__init__()

    def get_cache_key(self, request, view):  # type: ignore[override]
        if self.rate is None:
            return None

        if request.user and request.user.is_authenticated:
            ident = f"user:{request.user.pk}"
        else:
            ident = f"ip:{self.get_ident(request)}"

        return self.cache_format % {"scope": self.scope, "ident": ident}

    def get_rate(self) -> str | None:
        if self.rate_setting_name:
            rate = getattr(settings, self.rate_setting_name, None)
            if rate:
                return rate
        return super().get_rate()


class MessageBurstRateThrottle(ConfigurableUserRateThrottle):
    scope = "message-burst"
    rate_setting_name = "MESSAGE_BURST_RATE"


class MessageSustainedRateThrottle(ConfigurableUserRateThrottle):
    scope = "message-sustained"
    rate_setting_name = "MESSAGE_SUSTAINED_RATE"


class ReactionBurstRateThrottle(ConfigurableUserRateThrottle):
    scope = "reaction-burst"
    rate_setting_name = "REACTION_BURST_RATE"


class ReactionSustainedRateThrottle(ConfigurableUserRateThrottle):
    scope = "reaction-sustained"
    rate_setting_name = "REACTION_SUSTAINED_RATE"
