import jwt
from jwt.exceptions import PyJWTError
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

@database_sync_to_async
def get_user(token: str):
    try:
        decoded = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
            leeway=30,
        )
        uid = decoded.get("sub")
        email = decoded.get("email")
        if uid:
            user, _ = User.objects.get_or_create(
                username=uid, defaults={"email": email, "supabase_uid": uid}
            )
            return user
    except PyJWTError:
        pass
    return AnonymousUser()


class SupabaseJWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope.get("headers", []))
        token = None
        if b"authorization" in headers:
            auth_header = headers[b"authorization"].decode()
            if auth_header.lower().startswith("bearer "):
                token = auth_header.split()[1]
        if not token:
            query = parse_qs(scope.get("query_string", b"").decode())
            token = (query.get("token") or [None])[0]
        scope["user"] = await get_user(token) if token else AnonymousUser()
        return await super().__call__(scope, receive, send)
