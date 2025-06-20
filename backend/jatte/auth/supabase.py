import jwt
from jwt import PyJWKClient
from jwt.exceptions import PyJWTError

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """Authenticate requests using Supabase-issued JWT tokens."""

    def __init__(self):
        jwks_url = settings.SUPABASE_JWKS_URL
        if not jwks_url:
            raise exceptions.AuthenticationFailed("Supabase JWKS URL not configured")
        self.jwks_client = PyJWKClient(jwks_url)

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
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            decoded = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
        except PyJWTError as e:
            raise exceptions.AuthenticationFailed(f"Invalid token: {e}")

        uid = decoded.get("sub")
        if not uid:
            raise exceptions.AuthenticationFailed("No 'sub' claim found")

        email = decoded.get("email")
        if not email:
            raise exceptions.AuthenticationFailed("No 'email' claim found")

        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=uid,
            defaults={"email": email, "supabase_uid": uid},
        )
        if not created and not getattr(user, "supabase_uid", None):
            user.supabase_uid = uid
            user.save(update_fields=["supabase_uid"])

        return (user, None)
