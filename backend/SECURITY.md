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

## Attachment privacy and upload integrity

Chat attachment downloads are private by default. `POST
/api/attachments/sign/` (and `/attachments/sign/`) creates a short-lived
upload session in Redis, with Django cache as a development fallback. The
session binds the generated attachment ID and sanitized filename, canonical
GCS blob path, uploader, authorized room, optional message, MIME type, and
declared size. `POST /api/attachments/commit/` (and its non-API alias) rechecks
that binding and current room/message access, then verifies the downloaded
object's size and SHA-256 checksum before writing metadata into the parent
message's JSON attachment list. Immutable metadata (including blob, uploader,
room, optional message, size, and checksum) carries a server HMAC so forged
client JSON cannot make the download endpoint sign an arbitrary object. A
consumed session retains its committed result until its normal expiry so
retries are idempotent and cannot append a duplicate attachment.

Normal message create and update routes do not trust nested attachment JSON.
Before persistence they verify the HMAC, uploader policy, room/CID, optional
message binding, size, MIME type, checksum, blob, and deployment-specific URL.
An upload committed before its message exists is accepted only in its bound
room, then transactionally rebound to the newly created message and re-signed.
Message updates accept only metadata already bound to that same message.

Private attachment metadata keeps the Stream-compatible `url` field, but the
field points to `GET /api/attachments/<attachment_id>/download/`. That endpoint
requires a Supabase Bearer JWT, finds the attachment only through a parent room
the caller can currently access, and redirects to a short-lived signed GCS GET
URL. Missing and inaccessible attachment IDs both return 404. Only attachments
with scan status `clean` are served: `pending` is locked, `flagged` is
forbidden, and scan `error` is unavailable.

The legacy `POST /api/attachments/` and `/attachments/` compatibility routes
create explicitly marked `legacy_placeholder` metadata only. Message routes
normalize its uploader and room fields and accept it only with the exact
application attachment URL and no blob, checksum, content type, or integrity
signature. It is deliberately non-downloadable and cannot later be upgraded
to trusted blob metadata through message create or update.

Public-by-link downloads are an explicit deployment exception. They are
enabled only with `CHAT_ATTACHMENTS_PUBLIC_DOWNLOADS=true`; merely configuring
`CHAT_ATTACHMENTS_PUBLIC_BASE_URL` does not expose public URLs. When enabled,
the returned `url` is a bearer credential and anyone who obtains it can bypass
application room reauthorization. Production deployments should leave this
flag false unless that exposure is an intentional product policy.
