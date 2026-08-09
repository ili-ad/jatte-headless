#backend/accounts_supabase/authentication.py

import jwt
from jwt import PyJWKClient
from jwt.exceptions import (
    PyJWTError,
    ExpiredSignatureError,
)
from django.conf import settings
from rest_framework import authentication, exceptions
from django.contrib.auth import get_user_model
from rest_framework.authentication import SessionAuthentication

User = get_user_model()


def decode_supabase_token(token: str) -> dict:
    """Validate a Supabase JWT using the same rules for HTTP and WebSockets."""

    try:
        issuer = getattr(settings, "SUPABASE_JWT_ISSUER", None)
        audience = getattr(settings, "SUPABASE_JWT_AUDIENCE", None)
        if not issuer or not audience:
            raise exceptions.AuthenticationFailed("Invalid token authority configuration")
        decode_options = {"require": ["sub", "exp", "iat", "iss", "aud"]}
        algorithm = jwt.get_unverified_header(token).get("alg")
        if algorithm == "HS256":
            return jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience=audience,
                issuer=issuer,
                options=decode_options,
                leeway=30,
            )
        if algorithm == "RS256":
            jwks_url = settings.SUPABASE_JWKS_URL
            if not jwks_url:
                raise exceptions.AuthenticationFailed("Invalid token")
            signing_key = PyJWKClient(jwks_url).get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=audience,
                issuer=issuer,
                options=decode_options,
                leeway=30,
            )
        raise exceptions.AuthenticationFailed("Invalid token algorithm")
    except ExpiredSignatureError:
        raise exceptions.AuthenticationFailed("Token expired")
    except PyJWTError as exc:
        raise exceptions.AuthenticationFailed("Invalid token") from exc


def resolve_supabase_user(decoded: dict):
    """Resolve validated JWT claims to the shared Django user identity."""

    uid = decoded.get("sub")
    if not uid:
        raise exceptions.AuthenticationFailed("No 'sub' claim found")

    email = decoded.get("email") or ""
    user, created = User.objects.get_or_create(
        username=uid,
        defaults={"email": email, "supabase_uid": uid},
    )
    if not created and not user.supabase_uid:
        user.supabase_uid = uid
        user.save(update_fields=["supabase_uid"])
    if email and not user.email:
        user.email = email
        user.save(update_fields=["email"])
    return user


def authenticate_supabase_token(token: str):
    """Validate ``token`` and return the same user REST authentication uses."""

    return resolve_supabase_user(decode_supabase_token(token))


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """Deprecated compatibility name; session auth always enforces CSRF.

    API requests use Supabase Bearer JWTs.  Keeping this class CSRF-safe avoids
    accidentally turning a CSRF-exempt compatibility endpoint into a cookie
    authenticated state-changing endpoint.
    """

    def enforce_csrf(self, request):
        return super().enforce_csrf(request)

class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        try:
            token_type, token = auth_header.split()
            if token_type.lower() != "bearer":
                return None
        except ValueError:
            return None

        decoded = decode_supabase_token(token)
        user = resolve_supabase_user(decoded)
        # Views that need claim-level policy decisions consume only claims that
        # have already passed the shared PR10 authority validation above.
        request.supabase_claims = decoded

        # Return the original JWT so views can forward it if needed
        return (user, token)

class DevTokenOrJWTAuthentication(SupabaseJWTAuthentication):
    """Legacy name for Supabase Bearer JWT authentication only.

    It intentionally ignores development identity headers (including
    ``X-User-ID``) in every settings mode.  Do not add impersonation or
    development-token support here.
    """

    def authenticate(self, request):
        return super().authenticate(request)
