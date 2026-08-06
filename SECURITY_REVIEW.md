# Security review

Review scope: the Django/DRF/Channels backend under backend/, plus the frontend Stream adapter where it defines the protocol contract. This is a static review of the current tree, not a penetration test. Route aliases with and without trailing slashes are grouped together.

## Findings summary

The primary risk is inconsistent room authorization. Most REST views require JWT authentication, but several room/message handlers do not enforce membership. The WebSocket consumer accepts missing or invalid tokens and subscribes clients without a membership check. These are must-fix because they can expose chat history, member lists, typing/presence events, and message creation or mutation.

## 1. REST endpoints

The default DRF configuration is DevTokenOrJWTAuthentication plus IsAuthenticated. The class name is misleading in this checkout: it delegates to Supabase JWT authentication and does not currently accept a development token.

### Account, system, and compatibility routes

| Route family | Checks observed | Classification |
| --- | --- | --- |
| /api/token/ | Token view; inspect separately before exposing publicly. A DEBUG-only development stub is commented in jatte/urls.py. | should-fix |
| /api/sync-user/, /sync-user/, /api/session/, /session/, /api/client-id/, /client-id/, /api/refresh-token/, /refresh-token/, /api/user/, /user/, /api/user-agent/, /api/core-user-agent/, /api/disconnected/, /api/initialized/ | Implementations are split between auth, accounts_supabase, users, and core; most API views use JWT plus IsAuthenticated. Duplicate includes create route ambiguity and need endpoint tests. | should-fix |
| /api/ws-auth/, /ws-auth/, /api/connection-id/, /connection-id/, /api/ws-auth/live/ | There are manual function views and DRF views. Manual legacy views decode Bearer themselves and return 403 on missing/invalid input; they do not use normal DRF authentication. The legacy generated WS token is not bound to a room or user. | must-fix |
| /api/app-settings/, /, /about/, /api/tag/, /api/user-agent/ | Core compatibility/config endpoints; authentication varies by implementation and should not be assumed from the global default for function views. | should-fix |
| /users/, /api/users/ | User-directory/query endpoints; JWT authentication is expected. Verify directory visibility is intentional for every authenticated user. | should-fix |
| /mute-status/<username>/, /muted-users/, /muted-channels/, /mute/<username>/, /unmute/<username>/ | JWT plus IsAuthenticated; verify callers can change only their own mute state. | tests-needed |
| /reminders/, /reminders/<id>/, /api/reminders/, /api/reminders/<id>/, /api/rooms/<room>/reminders/ | JWT plus IsAuthenticated; reminder ownership/room checks need cross-user tests. | tests-needed |
| /polls/, /polls/<id>/, /polls/<poll>/options/, /polls/<poll>/options/<option>/votes/ | JWT plus IsAuthenticated; poll and vote authorization must be checked against the parent room. | tests-needed |
| /recover-state/, /disconnected/, /initialized/, /editing-audit-state/ and API variants | JWT is configured on state views; state should be user-scoped. Legacy function variants are not uniformly protected by DRF decorators. | should-fix |
| /api/text-composer/, /api/init-state/, /api/state/, /api/compose/, /api/has-sendable-data/, /api/composition-is-empty/, /api/context-type/, /api/get-client/, /api/intro/, /subarray/, /api/subarray/, /api/listeners/, /api/on/, /api/off/, /api/dispatch-event/, /api/register-subscriptions/, /api/quoted-message/, /api/test/ | Mostly JWT plus IsAuthenticated compatibility endpoints. Stateful/event-like behavior should be proven user-scoped; legacy chat/api.py functions include csrf_exempt and manual auth. | should-fix |

### Room and message routes

| Route family | Checks observed | Classification |
| --- | --- | --- |
| /api/rooms/, /api/rooms/active/, /rooms/, /rooms/active/ | JWT plus IsAuthenticated; list/create behavior is not a substitute for per-room authorization. | tests-needed |
| /api/rooms/resolve/ | JWT decorator is present. Resolution can identify or create a room; verify arbitrary identifiers cannot be enumerated/created without membership or public-room policy. | should-fix |
| /api/rooms/<cid>/members/ and /api/rooms/<room>/members/ | JWT is present, but the CID member-list compatibility view does not consistently enforce membership before collecting members. | must-fix |
| /api/rooms/<cid>/messages/ and /api/rooms/<room>/messages/ | JWT plus IsAuthenticated; list/create implementations are not consistently protected by _user_can_access_room. This is the principal history/message leakage risk. | must-fix |
| /api/rooms/<room>/mark_read/, mark_unread/, read/, count_unread/, last_read/ | JWT plus IsAuthenticated; several handlers read/update per-user state without an explicit room-membership gate. | must-fix |
| /api/rooms/<cid>/config/, /config-state/, /cooldown/ | JWT plus IsAuthenticated; room lookup exists, but membership/role checks are inconsistent. Config mutation must not be available to anyone who guesses a UUID. | must-fix |
| /api/rooms/<room>/draft/ | JWT plus IsAuthenticated; should be user/room scoped. Test cross-user read/write. | tests-needed |
| /api/rooms/<cid>/mute/ and /mutes/ | JWT plus IsAuthenticated; member-mute operations need room membership and moderator/owner policy. | must-fix |
| /api/rooms/<room>/pinned/ and /query/ | JWT plus IsAuthenticated; room lookup is not consistently followed by membership enforcement. | must-fix |
| /api/rooms/<room>/archive/, unarchive/, truncate/, hide/, show/ | JWT plus IsAuthenticated; destructive/admin-like operations need explicit membership and role checks. | must-fix |
| /api/messages/<id>/ and /api/rooms/<cid>/messages/<id>/ | JWT plus IsAuthenticated; direct lookup is used in paths without proving the message belongs to an accessible room. Update/delete need author/moderator policy. | must-fix |
| /api/messages/<id>/hide/, /restore/, and non-api aliases | JWT plus IsAuthenticated; authorization is not uniformly tied to an accessible room or actor permission. | must-fix |
| /api/messages/<id>/reactions/, /reactions/<type>/, /flag/, /pin/, /unpin/, /actions/ | JWT plus IsAuthenticated; parent lookup does not consistently establish room membership. Pin/unpin/actions need role/ownership rules. | must-fix |
| /messages/<id>/replies/ and /threads/ | Thread views explicitly call _user_can_access_room; this is the reference pattern. Pagination is cursor-based but needs authorization/cursor tests. | tests-needed |
| /search/messages/ | JWT plus IsAuthenticated; search scope must be constrained to accessible rooms. | must-fix |
| /api/link-preview/ and /link-preview/ | JWT plus IsAuthenticated; safe as metadata validation, but SSRF controls are needed if it later fetches URLs. | should-fix |

### Agent, admin, notification, and SMS routes

| Route family | Checks observed | Classification |
| --- | --- | --- |
| /chat/agent/<cid>/invoke/, /chat/agent/<cid>/invoke-echo/, /api/chat/agent/rag/, /chat/agent/policy, skills, memory, runs, simulate, <cid>/enable/, <cid>/disable/, <cid>/, cancel/ | JWT is generally present, but handlers do not all perform an explicit room-membership check. Invocation/cancellation can cause expensive side effects. | must-fix |
| /chat/admin/queue/, agent-runs/, rooms/<cid>/claim/, gating/intake/audit routes | Administrative operations need staff/role authorization, not only IsAuthenticated. | must-fix |
| /chat/notifications/intake/, oncall/, presence/, escalate/ | Operational side-effecting routes need explicit staff/service authorization. | must-fix |
| /chat/integrations/sms/webhook/ | Inbound webhook is not protected by DRF IsAuthenticated; it relies on provider signature validation. Signature, replay, and canonical-body checks must be mandatory. | must-fix |
| /chat/integrations/sms/send/ and /receipt/ | Need separate service or authenticated-user policy; browser JWT must not stand in for provider callback authentication. | should-fix |

## 2. WebSocket entry points

There is one ASGI route: /ws/<room_key>/. The frontend opens /ws/{cid}/?token={jwt}.

Observed behavior:

- OriginValidator checks http://localhost:3000, http://127.0.0.1:3000, and DJANGO_WS_ALLOWED_ORIGINS.
- AuthMiddlewareStack is present, but the consumer independently reads a query-string token and defaults self.user to anonymous if no token is supplied or decoding fails.
- The consumer accepts the socket after failed authentication.
- channel.watch calls _room_state, which get_or_creates Channel and Room, returns messages/members, then joins the room group. No _user_can_access_room check occurs.
- message.new creates a message for the watched CID without checking authentication or membership.
- Typing events go to the room group, or a lobby group when no CID is available. Presence is also broadcast to a lobby group.
- Disconnect removes group membership. A token bucket limits message frequency; rate limiting is not authorization.

Missing hard authentication and membership checks are must-fix. Add tests for invalid/expired/missing tokens, unauthorized watch/send, cross-room event delivery, typing/presence scope, and origin allowlisting (tests-needed). Reject a mismatch between route room_key and payload cid (should-fix).

## 3. Attachment upload, download, and storage

There are three upload paths:

- POST /api/attachments/ and /attachments/ create metadata with a generated ID and an absolute /attachments/... URL. No file bytes are stored. JWT plus IsAuthenticated is required, but the record is not bound to a room, message, or uploader.
- POST /api/attachments/sign/ and /attachments/sign/ sanitize filenames, enforce configured MIME/size limits, generate a GCS V4 signed PUT URL, and cache a short-lived session containing user, CID, message ID, blob, declared size/type, and attachment ID.
- POST /api/attachments/commit/ and /attachments/commit/ require the upload-session user, exact blob/size, download the object through a short-lived signed GET, compare SHA-256, and optionally attach metadata. Attaching checks message-to-room membership and _user_can_access_room and permits author, staff/superuser, or room agent. A scan is queued and a public blob URL is returned.

Risks:

- Objects use attachments/<generated-id>/<safe-filename>.
- The returned URL is CHAT_ATTACHMENTS_PUBLIC_BASE_URL plus the blob, a Google Storage URL, or a local metadata URL. No authenticated download endpoint was found that rechecks room membership. A public bucket/base URL makes the URL a bearer credential. This must be an explicit deployment decision (must-fix).
- MIME and declared size are checked at sign time; object size and checksum are rechecked at commit. Content sniffing, decompression bombs, active image/PDF content, and scan-failure behavior need tests (tests-needed).
- Upload sessions are deleted on most failures and successful commit; expiry and replay/idempotency need tests. Repeated commit must not attach twice (tests-needed).
- Signed upload URLs are bearer access until expiry. TTL, IAM, retention, lifecycle cleanup, and cache isolation need production configuration (should-fix).

## 4. Development-only authentication and identity inputs

- Current DevTokenOrJWTAuthentication does not accept X-User-ID; it is an alias for JWT authentication.
- Repository search found no active backend X-User-ID acceptance. The frontend sends Supabase Bearer JWTs. Test-only shortcuts must not enter deployed settings.
- A commented DEBUG-only dev_token route remains in jatte/urls.py. Keep it unreachable in production and add a DEBUG=False regression test proving no development token/header can authenticate (should-fix).
- Legacy function endpoints manually decode Authorization instead of using DRF. This second auth implementation should be consolidated (must-fix).

## 5. Deployment and browser security assumptions

### CORS and CSRF

- CorsMiddleware is installed. CORS_ALLOWED_ORIGINS defaults to the two local frontend origins and can be replaced by DJANGO_CORS_ALLOWED_ORIGINS.
- CORS_ALLOW_CREDENTIALS=False; browser requests are intended to use Bearer tokens, not cross-site session cookies.
- CSRF middleware is installed, but CsrfExemptSessionAuthentication.enforce_csrf() explicitly bypasses CSRF. Legacy compatibility views include @csrf_exempt. This is safe only for bearer-token-only endpoints with no cookie/session authorization; ensure state-changing routes cannot inherit the bypass (must-fix).
- The frontend sends an X-CSRFToken cookie value in some paths, but the primary JWT path does not rely on it. Document the auth model and test cross-origin state-changing requests (tests-needed).

### Hosts, debug, and secrets

- jatte/settings.py hard-codes DEBUG=True, local-only ALLOWED_HOSTS, and a Django-insecure SECRET_KEY. SUPABASE_JWT_SECRET defaults to changeme. Running this settings module in production is unsafe (must-fix).
- jatte/settingsprod.py sets DEBUG=False and production hosts, but repeats the same hard-coded Django-insecure SECRET_KEY and has the changeme Supabase secret fallback. Secrets must come from environment/secret manager and startup must fail closed (must-fix).
- ALLOWED_HOSTS differs between settings modules. Deployments should select one intentionally and include actual HTTPS/WebSocket hosts (should-fix).

### WebSocket origin and transport

- OriginValidator is allowlist-based, but production origins are only added by DJANGO_WS_ALLOWED_ORIGINS; settingsprod.py does not define the list. Missing values can reject the frontend, broad values can trust unintended origins (should-fix).
- Legacy /api/ws-auth/ constructs ws:// from request host rather than selecting wss:// for TLS (must-fix).
- Origin validation is not a substitute for JWT and room authorization; both are required (must-fix).

## 6. Stream Chat compatibility assumptions

frontend/src/lib/stream-adapter/Channel.ts depends on:

- canonical CIDs such as messaging:<room-uuid>, stable room/message URL shapes, and trailing/non-trailing slash aliases;
- channel.watch returning initialized messages, a next cursor, and members;
- REST operations for messages/pagination, mark-read/unread, drafts, config/config-state, members, query, pinned messages, hide/show/truncate, reactions, replies/threads, polls, reminders, link previews, attachments, restore/hide, subscriptions, and agent cancellation/invocation;
- Bearer JWT headers for REST and ?token=<jwt> for WebSockets;
- Stream-like events including channel.watch, message.new, message.updated, typing start/stop, presence, read events, AI indicator events, and initialized state;
- message fields including id, text/body, user, timestamps, attachments, reactions, replies, pinned/hidden state, and custom data;
- delivery to the CID group so clients in other rooms do not receive events;
- stable cursor semantics and response shapes.

These constraints mean hardening should use shared authorization helpers and consumer gates, with contract tests around existing shapes (should-fix). They do not justify unauthenticated or non-member access to compatible payloads (must-fix).

## 7. Missing or insufficient tests

- must-fix: every room-scoped read/write route, member vs authenticated non-member vs anonymous, guessed UUIDs, and a message ID from another room.
- must-fix: message update/delete/hide/restore/reaction/pin/flag/action for author, ordinary member, non-member, staff, and room agent.
- must-fix: REST list/search/query/pinned/member tests proving no cross-room response or count leakage.
- must-fix: WebSocket missing/malformed/expired/wrong-user/valid tokens; unauthorized watch/send; cross-room subscription/event leakage; typing/presence scope.
- must-fix: admin, agent, notification, and SMS webhook tests proving staff, service signature, replay, and role checks.
- tests-needed: pagination cursor boundaries, duplicates/omissions, invalid cursors, room changes between pages, hard limits, and authorization recheck on each page.
- tests-needed: idempotency for repeated sends, attachment commits, retries after broadcast failure, and duplicate event delivery.
- tests-needed: attachment MIME spoofing, oversized content, bad checksum, wrong blob, expired session, cross-user reuse, message/CID mismatch, scan states, public/private download, and abandoned-object cleanup.
- tests-needed: CORS/CSRF/Host/Origin, cookies versus Bearer auth, DEBUG=False, missing secrets, and WSS URL generation.
- should-fix: route contract tests for duplicate aliases and included URL modules so an unprotected compatibility route cannot diverge.
- defer: performance/load tests for Redis fanout and attachment scanning after authorization is correct.

## Recommended remediation order

1. Require and validate a real JWT during WebSocket connection setup; reject invalid/missing tokens.
2. Centralize room authorization before every room/message read, mutation, subscription, and event broadcast. Add role checks for destructive/admin operations.
3. Decide whether attachment downloads are authenticated or intentionally public; implement and test that policy.
4. Remove hard-coded/fallback production secrets and make DEBUG/hosts/origins fail closed.
5. Consolidate legacy manual auth and compatibility routes, preserving the existing Stream-compatible contract with tests.

