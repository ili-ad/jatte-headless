"""Fail-closed production overrides for JATTE's shared application settings.

The application graph and runtime topology live in :mod:`jatte.settings`.
Production deliberately disables development ``.env`` loading before importing
that shared source, then replaces every security-sensitive development default
with explicit deployment configuration.
"""

import os

from .security_settings import (
    ProductionConfigurationError,
    required_csv,
    required_secret,
    required_value,
)


# Production configuration must come from the process environment, never the
# developer .env file that jatte.settings supports for local work.
os.environ["JATTE_LOAD_DOTENV"] = "false"

# Validate DATABASE_URL before importing the shared settings because that
# module constructs DATABASES eagerly through dj_database_url.
required_value("DATABASE_URL")

from .settings import *  # noqa: E402,F403

if DATABASES["default"]["ENGINE"] != "django.db.backends.postgresql":  # noqa: F405
    raise ProductionConfigurationError(
        "DATABASE_URL must configure PostgreSQL in production"
    )


SECRET_KEY = required_secret("DJANGO_SECRET_KEY")
SUPABASE_JWT_SECRET = required_secret("SUPABASE_JWT_SECRET")
CHAT_INTERNAL_SERVICE_TOKEN = required_secret("CHAT_INTERNAL_SERVICE_TOKEN")
SMS_WEBHOOK_SECRET = required_secret("SMS_WEBHOOK_SECRET")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_JWKS_URL = os.environ.get("SUPABASE_JWKS_URL") or (
    f"{SUPABASE_URL.rstrip('/')}/auth/v1/keys" if SUPABASE_URL else None
)
SUPABASE_JWT_ISSUER = os.environ.get("SUPABASE_JWT_ISSUER") or (
    f"{SUPABASE_URL.rstrip('/')}/auth/v1" if SUPABASE_URL else None
)
if not SUPABASE_JWT_ISSUER:
    raise ProductionConfigurationError(
        "SUPABASE_JWT_ISSUER or NEXT_PUBLIC_SUPABASE_URL must be configured in production"
    )
SUPABASE_JWT_AUDIENCE = os.environ.get(
    "SUPABASE_JWT_AUDIENCE", "authenticated"
).strip()
if not SUPABASE_JWT_AUDIENCE:
    raise ProductionConfigurationError(
        "SUPABASE_JWT_AUDIENCE must not be empty in production"
    )

DEBUG = False
ALLOWED_HOSTS = required_csv("DJANGO_ALLOWED_HOSTS")
CORS_ALLOWED_ORIGINS = required_csv("DJANGO_CORS_ALLOWED_ORIGINS")
DJANGO_WS_ALLOWED_ORIGINS = required_csv("DJANGO_WS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = False

# TLS terminates at the trusted reverse proxy. Deployments must ensure only
# that proxy can supply X-Forwarded-Proto/X-Forwarded-Host.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

try:
    SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", "3600"))
except ValueError as exc:
    raise ProductionConfigurationError(
        "SECURE_HSTS_SECONDS must be a positive integer"
    ) from exc
if SECURE_HSTS_SECONDS <= 0:
    raise ProductionConfigurationError(
        "SECURE_HSTS_SECONDS must be a positive integer"
    )
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

# COOP is intentionally disabled because JATTE's browser integration does not
# currently depend on cross-origin opener isolation. Other deploy checks and
# browser protections remain explicit above.
SECURE_CROSS_ORIGIN_OPENER_POLICY = None
