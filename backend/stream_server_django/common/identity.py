from __future__ import annotations

from typing import Any, Callable, Optional

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


class PrincipalBackedIdentity(ChatIdentity):
    """
    Identity implementation backed primarily by a 'principal' object
    (e.g., a JWT-derived claims object) with optional lazy loading
    of a Django user instance.

    This lets host projects supply a principal (e.g. Supabase claims)
    and only hit the database to resolve a concrete AUTH_USER_MODEL
    when some flows require a real user row (mutes, reminders, etc.).
    """

    def __init__(
        self,
        principal: Any,
        user: Optional[Any] = None,
        user_loader: Optional[Callable[[], Any]] = None,
    ) -> None:
        """
        Args:
            principal: Claims / principal object for the caller.
            user: Optional concrete Django user instance, if already resolved.
            user_loader: Optional callable to lazily resolve/create a user
                         when as_user() is first called. Should return a
                         Django user instance or raise if resolution fails.
        """

        self._principal = principal
        self._user_loader = user_loader
        self._user = user

        # Initialize the base ChatIdentity with the best-known user object.
        # If no user is provided, start with an AnonymousUser placeholder
        # until as_user() resolves one via the loader.
        super().__init__(user=user if user is not None else AnonymousUser())

    # ---- Lazy user resolution ----

    def _ensure_user(self) -> Any:
        """
        Ensure self._user is populated.

        If user_loader is provided and no user is set yet, call it and cache
        the result. If no loader is provided, leave the base user as-is.
        """

        if self._user is None and self._user_loader is not None:
            self._user = self._user_loader()
        return self._user if self._user is not None else self.user

    # ---- Core auth flags ----

    @property
    def is_authenticated(self) -> bool:
        # Prefer explicit principal flag, fallback to base user behavior
        if hasattr(self._principal, "is_authenticated"):
            return bool(getattr(self._principal, "is_authenticated"))
        return super().is_authenticated

    @property
    def is_staff(self) -> bool:
        if hasattr(self._principal, "is_staff"):
            return bool(getattr(self._principal, "is_staff"))
        return super().is_staff

    @property
    def is_superuser(self) -> bool:
        if hasattr(self._principal, "is_superuser"):
            return bool(getattr(self._principal, "is_superuser"))
        return super().is_superuser

    # ---- Identity fields ----

    @property
    def id(self) -> Any:
        """
        Return an identifier for this identity.

        Resolution order:
        - principal.id
        - principal.sub
        - base ChatIdentity user id
        """

        if hasattr(self._principal, "id"):
            return getattr(self._principal, "id")
        if hasattr(self._principal, "sub"):
            return getattr(self._principal, "sub")
        return super().id

    @property
    def username(self) -> str:
        """
        Resolve a display name / username.

        Resolution order:
        - principal.username
        - principal.name
        - base ChatIdentity username
        """

        for attr in ("username", "name"):
            if hasattr(self._principal, attr):
                value = getattr(self._principal, attr)
                if value:
                    return str(value)
        return super().username

    @property
    def email(self) -> str:
        if hasattr(self._principal, "email"):
            value = getattr(self._principal, "email")
            if value:
                return str(value)
        return super().email

    @property
    def supabase_uid(self) -> Optional[str]:
        """
        Resolve a Supabase-like UID if present on the principal,
        otherwise fall back to the base user.
        """

        for attr in ("supabase_uid", "sub", "uid"):
            if hasattr(self._principal, attr):
                value = getattr(self._principal, attr)
                if value:
                    return str(value)
        return super().supabase_uid

    # ---- Coarse role ----

    @property
    def role(self) -> str:
        """
        Coarse-grained role aligned with Stream-like semantics.

        Resolution order:
        - principal.role (if present)
        - base ChatIdentity role ('anonymous' / 'user')
        """

        if hasattr(self._principal, "role"):
            value = getattr(self._principal, "role")
            if value:
                return str(value)
        return super().role

    # ---- Underlying user access ----

    @property
    def user(self) -> Any:
        """
        Return the best-known Django user object.

        If a user_loader is provided and no user is cached yet,
        this will NOT eagerly load it; call as_user() for that.
        """

        return super().user

    def as_user(self) -> Any:
        """
        Return a concrete Django user instance, resolving/creating it lazily
        if a user_loader was provided.

        Host projects can supply a user_loader that:
        * looks up a user by principal claims, or
        * creates a new user row if none exists.
        """

        user = self._ensure_user()
        return user


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
