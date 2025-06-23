#backend/accounts_supabase/authentication.py

import jwt
from jwt import PyJWKClient
from jwt.exceptions import (
    PyJWTError,
    InvalidTokenError,
    ExpiredSignatureError,
    InvalidSignatureError,
)
from django.conf import settings
from rest_framework import authentication, exceptions
from django.contrib.auth import get_user_model
from rest_framework.authentication import SessionAuthentication

User = get_user_model()

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # Explicitly bypass CSRF validation

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

        try:
            decoded = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
                leeway=30,   # allow 30-second clock skew
            )
        except ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Token expired")
        except InvalidSignatureError:
            jwks_url = settings.SUPABASE_JWKS_URL
            if not jwks_url:
                raise exceptions.AuthenticationFailed("Invalid token")
            try:
                signing_key = PyJWKClient(jwks_url).get_signing_key_from_jwt(token)
                decoded = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256"],
                    options={"verify_aud": False},
                )
            except PyJWTError as e:
                raise exceptions.AuthenticationFailed(f"Invalid token: {e}")
        except PyJWTError as e:
            raise exceptions.AuthenticationFailed(f"Invalid token: {e}")

        uid = decoded.get("sub")
        if not uid:
            raise exceptions.AuthenticationFailed("No 'sub' claim found")

        email = decoded.get("email")
        if not email:
            raise exceptions.AuthenticationFailed("No 'email' claim found")

        # Use get_or_create, and ensure supabase_uid is set
        user, created = User.objects.get_or_create(
            username=uid,
            defaults={'email': email, 'supabase_uid': uid}
        )
        # If the user exists but supabase_uid is not set, update it
        if not created and not user.supabase_uid:
            user.supabase_uid = uid
            user.save(update_fields=["supabase_uid"])

        return (user, None)

class DevTokenOrJWTAuthentication(SupabaseJWTAuthentication):
    """Legacy alias without dev-token support."""

    def authenticate(self, request):
        return super().authenticate(request)
