# PR11 production settings contract

## Boundary inventory

`jatte.settings` is the shared application-topology source. It defines the
current application registry, middleware, URL/ASGI/WSGI entry points, auth
model, REST authentication and throttles, PostgreSQL parsing, Redis Channels,
caches, and application/service settings. Local development may load
`backend/.env`, uses `DEBUG=True`, permits localhost origins/hosts, and has
development-only secret and Supabase issuer defaults.

`jatte.settingsprod` disables `.env` loading, imports that shared topology, and
then replaces security-sensitive development defaults. It requires explicit
process-environment configuration and applies the production HTTP transport
boundary. This prevents a second independently maintained application graph.

## Required production configuration

Production startup fails closed unless these values are present:

- `DATABASE_URL`
- `DJANGO_SECRET_KEY`
- `SUPABASE_JWT_SECRET`
- `SUPABASE_JWT_ISSUER`, or `NEXT_PUBLIC_SUPABASE_URL` from which it is derived
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `DJANGO_WS_ALLOWED_ORIGINS`
- `CHAT_INTERNAL_SERVICE_TOKEN`
- `SMS_WEBHOOK_SECRET`

`SUPABASE_JWT_AUDIENCE` defaults to the explicit browser-user audience
`authenticated` and may be configured explicitly. Host/origin values are
comma-separated, non-wildcard allowlists. No secret value is documented here.

## Runtime topology

- Database: `DATABASE_URL`, parsed by `dj_database_url`; SSL is controlled by
  `DATABASE_SSL_REQUIRE` and there is no localhost/placeholder production
  fallback.
- Realtime: `channels_redis.core.RedisChannelLayer`, configured by
  `REDIS_HOST` and `REDIS_PORT`. Settings import and checks do not connect to
  Redis.
- Cache: the shared default cache plus the Redis-backed `throttles` cache.
- User model: `accounts_supabase.CustomUser`.
- Application graph: the complete shared JATTE list, including pgvector,
  accounts_supabase, mutes, reminders, rooms, events, state, polls, chat
  add-ons, and the agent add-on.
- Authentication: the shared Supabase bearer-token DRF boundary and PR10
  issuer/audience/lifetime validation remain in force. Internal service and SMS
  webhook secrets remain required.
- Attachments, SMS/provider, and other service configuration inherit the same
  application settings used in development, with production-required secrets
  revalidated after the shared import.

## HTTP transport boundary

Production uses `DEBUG=False`, explicit host/CORS/WebSocket allowlists, no CORS
credentials, trusted proxy scheme/host handling, HTTPS redirect, secure session
and CSRF cookies, clickjacking/content-type/referrer protection, and a
one-hour default HSTS duration. HSTS duration is configurable through
`SECURE_HSTS_SECONDS`, must remain positive, and intentionally excludes
subdomains and preload until deployment evidence supports those commitments.

## Boot proof

The subprocess regression test starts with synthetic environment values and
performs `django.setup()`, resolves `get_user_model()` and `jatte.urls`, and
imports both ASGI and WSGI applications. The focused GitHub Actions workflow
runs that test plus:

```console
python manage.py check --settings=jatte.settingsprod
python manage.py check --deploy --settings=jatte.settingsprod
```

These checks construct PostgreSQL and Redis configuration but never connect to
or mutate production infrastructure.

The deploy check exits successfully and intentionally reports Django warnings
`security.W005` and `security.W021`: this stage does not enable HSTS for every
subdomain and does not commit the domain to browser preload. Those flags are
unsafe to enable until operators prove every affected subdomain is permanently
HTTPS-capable. The warnings are left visible rather than globally silenced.
