from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework.exceptions import AuthenticationFailed

from stream_server_django.accounts_supabase.authentication import (
    authenticate_supabase_token,
)

@database_sync_to_async
def get_user(token: str):
    try:
        return authenticate_supabase_token(token)
    except AuthenticationFailed:
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
