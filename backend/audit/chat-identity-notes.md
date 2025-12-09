# Chat identity audit notes

## Current identity model
- Authentication primarily uses Supabase JWTs. `SupabaseJWTAuthentication` decodes `sub`/`email`, creates or fetches a Django user, and stores the Supabase UID on the user record so later requests have a concrete `User` instance. 【F:backend/stream_server_django/accounts_supabase/authentication.py†L10-L27】
- The user model extends `AbstractUser` with a nullable `supabase_uid`, and profiles hang off a `OneToOneField` to that user. 【F:backend/stream_server_django/accounts/models.py†L6-L26】
- Room access helpers collect multiple identifiers from the authenticated user (username, `supabase_uid`, stringified id) and require `is_authenticated` before proceeding. 【F:backend/stream_server_django/rooms/utils.py†L26-L64】

## How chat links messages/rooms to users
- Core models tie most chat artifacts to `AUTH_USER_MODEL` and rarely allow nulls:
  - `Room.agent` is the only nullable user FK in `Room`; it permits `null=True`/`blank=True` for unassigned rooms. 【F:backend/stream_server_django/chat/models.py†L128-L151】
  - Drafts, notifications, reactions, polls, poll options, poll votes, flags, pins, user mutes, room mutes, room member mutes, reminders (`created_by`), and web push subscriptions all require non-null foreign keys to the user model. 【F:backend/stream_server_django/chat/models.py†L156-L308】
- Read receipts store the user as a string ID (`ReadState.user`), not a FK, so they already tolerate arbitrary identifiers. 【F:backend/stream_server_django/chat/models.py†L120-L126】
- Admin-console add-ons introduce nullable ownership but otherwise keep FKs required: room ownership allows `owner=None`, but escalation records, admin presence, and on-call configs still point to users (some nullable in the notifications module). 【F:backend/stream_server_django/chat_addons/admin_console/models.py†L6-L26】【F:backend/stream_server_django/chat_addons/notifications/models.py†L7-L60】

## How agent/AI-related features derive user identity
- Agent invocation and RAG endpoints push the caller’s `request.user.id` into the agent service metadata (`user_id=str(... ) or None`) so LLM jobs can attribute requests. 【F:backend/stream_server_django/chat_addons/agent/views.py†L347-L392】
- Message gating and moderation flows rely on the sender’s `username` when creating messages, recording gating decisions, and checking whether a user can manage messages. 【F:backend/stream_server_django/chat/api_views.py†L335-L449】
- Room access checks, mute logic, and message management all assume real attributes on `request.user` (id, username, staff flags) for permission enforcement and payloads. 【F:backend/stream_server_django/chat/api_views.py†L1166-L1250】【F:backend/stream_server_django/rooms/utils.py†L26-L64】

## Requirements for anonymous/public chat
- Permission gates currently reject unauthenticated users up front (`user_has_room_access` returns `False` if `is_authenticated` is false), so read/write endpoints would need an alternate path for anonymous identities (e.g., session-bound tokens) before they can pass access checks. 【F:backend/stream_server_django/rooms/utils.py†L42-L64】
- Most chat models require a concrete user FK; to let anonymous messages persist, either nullable FKs or a synthetic guest user record would be needed for drafts, mutes, polls, reactions, reminders, pins/flags, and web push subscriptions. 【F:backend/stream_server_django/chat/models.py†L156-L308】
- Message creation, gating, and moderation expect a sender `username` and often stash it in Redis keys; anonymous chat would need a deterministic identifier (session-based, synthetic user, or provided `guest_id`) to keep these flows working. 【F:backend/stream_server_django/chat/api_views.py†L335-L449】

### Options for anonymous IDs
- **Synthetic/guest user records:** create a dedicated guest user per session or per room; keeps FK integrity without schema changes but inflates user table and still requires authentication middleware to mint one.
- **Nullable author fields + session identity:** relax FKs and pass a session-derived `actor_id` through serializers/gating; requires schema changes and downstream checks to handle `user=None` safely.
- **Hybrid:** keep messages authored by a synthetic ID while leaving moderation artifacts (flags/pins/mutes) disabled or optional for anonymous participants.

## Principal-based identity compatibility
- Views and helpers expect `request.user` to expose `is_authenticated`, `id`/`pk`, `username`, `email`, `is_staff`, and `is_superuser`; they also read `supabase_uid` where available for cross-system mapping. 【F:backend/stream_server_django/chat/api_views.py†L335-L449】【F:backend/stream_server_django/accounts_supabase/authentication.py†L10-L27】
- Many serializers and audit helpers stringify `id` or `username` when emitting payloads (e.g., gating decisions, mute broadcasts). A principal object would need equivalent properties or adapter methods to avoid attribute errors.
- Any principal lacking a DB row cannot satisfy the non-null FKs listed above; compatibility would require either lazy user creation from the principal claims or schema changes to let those relations be optional.

## Potential future split
- Define a `ChatIdentity` interface/ABC that surfaces the minimal properties chat code consumes (e.g., `user_id`, `display_name`, `is_authenticated`, `is_staff`, `as_user_instance()` optional hook).
- Implement adapters:
  - **Django user adapter:** wraps `AUTH_USER_MODEL` instances and proxies current attributes.
  - **Principal adapter:** wraps external claims objects, normalizes IDs/emails, and optionally materializes a user record when a FK is required (e.g., before writing reminders or mutes).
- Update permission helpers and serializers to consume `ChatIdentity` instead of raw `request.user`, enabling anonymous principals (session-bound) and claim-based principals to share the same surface area while keeping DB-backed flows explicit.
