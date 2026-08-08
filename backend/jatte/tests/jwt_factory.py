import time

import jwt
from django.conf import settings


def make_test_token(
    sub="test-user",
    *,
    email=None,
    claims=None,
    remove=(),
    algorithm="HS256",
    key=None,
    headers=None,
):
    """Mint a realistic Supabase access token for security and contract tests."""

    now = int(time.time())
    payload = {
        "sub": sub,
        "email": email or f"{sub}@example.com",
        "iss": settings.SUPABASE_JWT_ISSUER,
        "aud": settings.SUPABASE_JWT_AUDIENCE,
        "iat": now,
        "exp": now + 3600,
    }
    payload.update(claims or {})
    for claim in remove:
        payload.pop(claim, None)
    signing_key = key if key is not None else settings.SUPABASE_JWT_SECRET
    return jwt.encode(payload, signing_key, algorithm=algorithm, headers=headers)
