# Production authentication boundary

JATTE browser and API requests authenticate with Supabase Bearer JWTs. Cookie
or session authentication is not an alternative browser API authentication
mechanism, and compatibility endpoints that are CSRF-exempt must not opt into
session authentication.

Development identity headers and development tokens are not supported by the
backend. In particular, `X-User-ID` is ignored in all settings modes.

Production uses `jatte.settingsprod`. Startup requires all of the following:

- `DJANGO_SECRET_KEY`
- `SUPABASE_JWT_SECRET`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `DJANGO_WS_ALLOWED_ORIGINS`

The origin and host variables are comma-separated allowlists; wildcard values
are rejected. Production TLS is expected to terminate at a proxy that sets
`X-Forwarded-Proto: https`; this is used only because production settings
explicitly configure Django to trust that proxy header.
