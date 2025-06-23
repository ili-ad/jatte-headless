# Jatte Headless

This monorepo hosts a minimal chat demo built with Django Channels and Next.js. It ships with a local shim for the Stream Chat SDK so the UI can run without hitting the hosted Stream service.

## Development setup

1. Install Python and Node dependencies:

```bash
pnpm install
pnpm --filter frontend install
pip install -r backend/requirements.txt
```

2. Start the backend:

```bash
pnpm --filter backend exec python manage.py migrate --noinput
pnpm --filter backend exec daphne -p 8000 jatte.asgi:application
```

3. In another terminal, run the frontend:

```bash
pnpm --filter frontend dev
```

### Stream Chat toggle

The frontend automatically switches between a real Stream Chat client and the local Channels-backed shim. Set `NEXT_PUBLIC_STREAM_KEY` in `frontend/.env.local` to use your Stream Chat instance. If the variable is absent, the shim located at `libs/chat-shim` is used instead.

The `stream-chat` package remains in `devDependencies` so TypeScript types are available while runtime calls go through the shim.

### Terminology

In this codebase a *message* is the persisted chat content. A *draft* is a per-user, unsent message for a room (the Draft model). When you see *post* in the logs, it refers to the HTTP verb POST, not a domain object.

### API trailing slashes

All API endpoints are defined with a trailing slash. The frontend must include
this slash when making requests. Django's `APPEND_SLASH=True` only adds slashes
to GET requests, so POST calls need to provide the trailing `/` explicitly.
