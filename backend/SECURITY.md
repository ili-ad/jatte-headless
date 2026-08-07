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

## WebSocket boundary

WebSocket connections require a valid Supabase JWT before the server accepts
the socket. The active frontend uses `/ws/<cid>/`; `/ws/chat/` remains a
documented generic compatibility route because backend Stream-parity tests use
it to select a CID with `channel.watch`. Generic routing does not bypass room
authorization: watch, message creation, and typing require membership, and send
or typing additionally require a successful watch on that socket.

Authentication failures close with code 4401. Operation-level authorization
failures return an error frame so a generic socket may still watch a different
room it is authorized to access. Global lobby presence is disabled; the
existing `user.join` acknowledgement is sent only to the connecting socket.

## REST room and message authorization

Room-scoped REST endpoints resolve existing rooms without creating them and
return `403 Forbidden` when an authenticated caller lacks access. Missing room
identifiers return `404 Not Found`. Successful response fields remain aligned
with the Stream-compatible frontend contract.

The current room-access policy is intentionally legacy-compatible pending an
explicit membership model. Access is granted to authenticated staff and
superusers, the configured room agent, an identity matching `room.client`, or
an identity that previously sent a message attached to the room. The
prior-message signal is bounded to that room and is covered by regression
tests; new code must not broaden it to channel IDs or unrelated messages.

Direct message-ID endpoints require the message to be attached to at least one
room the caller can access. Message mutations require the author, room agent,
staff, or superuser. Room-wide destructive/configuration mutations and message
pin/action operations require the room agent, staff, or superuser. Ordinary
members may perform member-level actions such as reactions and flags only
after parent-room access succeeds.

The only public-room exception in this boundary is the explicitly allowlisted
agent-room `config-state` read controlled by `PUBLIC_AGENT_ROOM_SLUGS`. It does
not grant access to messages, members, drafts, counts, or other configuration
routes.
