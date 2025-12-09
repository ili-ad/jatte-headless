from __future__ import annotations

from typing import Any, Optional

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.utils.module_loading import import_string
from django.http import HttpRequest

UserModel = get_user_model()


class ChatIdentity:
    """
    Lightweight wrapper around the current Django user object.

    This is an internal abstraction so chat/agent/rooms code can
    depend on a stable interface (id/username/email/role/etc.)
    instead of reaching directly into request.user.

    In this initial version, ChatIdentity simply wraps the current
    AUTH_USER_MODEL or AnonymousUser instance without changing behavior.
    """

    def __init__(self, user: Any) -> None:
        self._user = user

    # --- Core auth flags ---

    @property
    def is_authenticated(self) -> bool:
        return bool(getattr(self._user, "is_authenticated", False))

    @property
    def is_staff(self) -> bool:
        return bool(getattr(self._user, "is_staff", False))

    @property
    def is_superuser(self) -> bool:
        return bool(getattr(self._user, "is_superuser", False))

    # --- Identity fields ---

    @property
    def id(self) -> Any:
        """
        Underlying user primary key (or None for anonymous).
        """

        return getattr(self._user, "id", None)

    @property
    def username(self) -> str:
        """
        Username or a blank string if not available.
        """

        value = getattr(self._user, "username", "")  # type: ignore[no-any-return]
        return value or ""

    @property
    def email(self) -> str:
        value = getattr(self._user, "email", "")  # type: ignore[no-any-return]
        return value or ""

    @property
    def supabase_uid(self) -> Optional[str]:
        """
        Supabase user identifier if the AUTH_USER_MODEL exposes it.

        Not all deployments must use Supabase, so this may be None.
        """

        return getattr(self._user, "supabase_uid", None)

    # --- Coarse role hint ---

    @property
    def role(self) -> str:
        """
        Coarse-grained role hint compatible with Stream-like semantics.

        Defaults:
        - 'anonymous' for unauthenticated users
        - getattr(user, 'role', 'user') for authenticated users

        Future work may introduce an explicit 'guest' role or custom
        mapping via a pluggable identity factory.
        """

        if not self.is_authenticated:
            return "anonymous"

        # Allow host projects to decorate the user with a 'role' attribute.
        return getattr(self._user, "role", "user")

    # --- Access to the underlying user object ---

    @property
    def user(self) -> Any:
        """
        Return the underlying Django user / AnonymousUser instance.

        This can be used where a concrete AUTH_USER_MODEL instance
        is still required (e.g., when writing FKs), and also serves
        as a hook for future identity adapters that may return None.
        """

        return self._user

    def as_user(self) -> Any:
        """
        Alias for compatibility with future identity adapter patterns.
        """

        return self._user


def get_chat_identity(request: HttpRequest) -> ChatIdentity:
    """
    Build a ChatIdentity from the current HTTP request via a configurable
    factory hook.

    The factory path is defined by the STREAM_SERVER_CHAT_IDENTITY_FACTORY
    setting and must point to a callable with the signature:
        (request: HttpRequest) -> ChatIdentity

    By default, this uses ``default_identity_factory`` which simply wraps
    request.user / AnonymousUser without changing behavior.
    """

    factory_path = getattr(
        settings,
        "STREAM_SERVER_CHAT_IDENTITY_FACTORY",
        "stream_server_django.common.identity.default_identity_factory",
    )
    factory = import_string(factory_path)
    identity = factory(request)

    if not isinstance(identity, ChatIdentity):
        raise TypeError(
            f"Expected ChatIdentity from {factory_path}, got {type(identity)!r}"
        )

    return identity


def default_identity_factory(request: HttpRequest) -> ChatIdentity:
    """
    Default ChatIdentity factory.

    This preserves the current behavior: wrap request.user if present,
    otherwise wrap an AnonymousUser instance.
    """

    user = getattr(request, "user", None)
    if user is None:
        user = AnonymousUser()
    return ChatIdentity(user)
