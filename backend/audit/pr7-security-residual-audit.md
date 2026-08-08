# PR7 Post-Hardening Residual Security Audit

## Scope and baseline

This audit was derived from the externally reachable code on `main`, not from the
PR1-PR6 audit notes. The starting commit was
`c8699f0125f3cfd5c2d33c45764cbb7c6cc6e080`. Before review, the combined PR1-PR6
security and compatibility suite passed: **90 tests passed**.

Review methods included recursive resolution of the production root URLconf,
manual URL-order review, serializer/model lookup tracing, authentication and
settings review, searches for outbound I/O and unsafe interpretation, task and
webhook state-transition review, attachment-flow review, Django deployment
checks, and inspection of the existing security tests. No secret value is
reproduced in this report.

## Executive conclusion

Material residual findings remain. No Critical finding was identified. Four High
findings require bounded corrective work: poll object authorization, the legacy
state-recovery alias, non-expiring locally minted refresh tokens, and a tracked
credential-like database configuration. The established room/message,
WebSocket, attachment-binding, and privileged-route controls remain effective on
the canonical paths covered by PR1-PR6.

## Findings

| ID | Severity | Attack surface | Affected path/component | Exploit prerequisite | Concrete failure mode | Evidence | Existing mitigation | Residual risk | Recommended action | Disposition |
|---|---|---|---|---|---|---|---|---|---|---|
| PR7-01 | High | REST / IDOR | `/polls/**`; `/api/polls/**`; `polls/views.py`; chat poll views in `chat/api_views.py` | Any valid user JWT plus a known/guessed CID or poll/option UUID | A user can list, create, answer, vote on, enumerate votes/counts for, or delete polls without proving access to the owning room. The legacy chat poll model has no room relationship at all. | Both view families use `IsAuthenticated` and direct `Poll`/`PollOption` lookups. Neither calls `require_room_access`; the `/polls/` model stores a caller-controlled CID, while the `/api/polls/` model lacks a CID/room field. | Authentication; bounded pagination in `/polls/`; option-to-poll matching. | Cross-room confidentiality and integrity loss; vote/member inference; deletion by unrelated users. | Unify or explicitly separate the two poll contracts, bind every poll to an existing room, authorize through that room, and add cross-room substitution/no-side-effect tests for every alias. | Must-fix follow-up; no safe audit-only patch because the legacy model requires a policy/schema decision. |
| PR7-02 | High | REST / state disclosure | `/recover-state/`; `state/views.py:recover_state` | Any valid user JWT | The non-API compatibility alias serializes every room in the database, including UUID, name, and room data, rather than only rooms accessible to the caller. | `Room.objects.all()` is used in the resolved production view. `/api/recover-state/` correctly uses `rooms_accessible_to_user()`, proving inconsistent alias behavior. | Authentication; notifications remain user-scoped. | Cross-room metadata disclosure and room-identifier enumeration. | Route the alias through the canonical recovery implementation or apply `rooms_accessible_to_user()` and add real-root-URLconf alias tests. | Must-fix follow-up; narrowly correct but grouped with the remaining alias authorization closure to avoid an incomplete one-off fix. |
| PR7-03 | High | Authentication / token lifetime | `/refresh-token/`; `/api/refresh-token/`; `accounts_supabase/views.py:RefreshTokenView` | A valid JWT at any point in time | The backend mints a new HS256 bearer JWT containing only `sub` and `email`. It has no `exp`, `iss`, or `aud`, so it remains acceptable indefinitely and is outside Supabase revocation/session policy. | `jwt.encode()` omits all lifetime and authority claims; shared decoding accepts HS256 and does not require those claims. | Initial request must authenticate; signing secret is production-required. | A one-time authenticated session can become a permanent backend credential. | Stop minting independent Supabase-equivalent tokens. Prefer returning/refreshing through Supabase; if a compatibility token is unavoidable, use a separate key/type, strict issuer/audience, short expiry, and explicit tests. | Must-fix follow-up; auth-contract decision required. |
| PR7-04 | High | Secrets / source exposure | `jatte/settings.py` commented database configuration | Read access to repository/history; impact depends on whether the credential is or was live | Tracked source contains a credential-like PostgreSQL password and account/host details in a commented block. Comments and git history do not protect credentials. | Secret-focused source review found the material; value intentionally omitted here. | Block is inactive; current database config uses `DATABASE_URL`. | Unauthorized database access if still valid, plus persistent exposure in history/forks. | Immediately determine validity, rotate/revoke regardless of current use, inspect access logs, remove from the tree, and use an approved history-remediation process if required. | Must-fix operational follow-up; do not expose the value in tickets/logs. |
| PR7-05 | Medium | JWT authority semantics | Shared HTTP/WebSocket decoder in `accounts_supabase/authentication.py` | Possession of a correctly signed token issued for another audience/project context using the configured signing authority | HS256 and RS256 validation disables audience checks and does not require issuer. A signature-valid token with `sub` is provisioned as a local user. | Both `jwt.decode()` calls set `verify_aud=False`; no issuer or required-claim configuration exists. | Algorithm allowlists, signature verification, expiry when present, 30-second leeway, required `sub`; JWT claims do not grant Django staff status. | Token confusion across audiences or Supabase contexts, depending on key reuse and deployment topology. | Require configured issuer and audience (or document a single-project proof), require `exp`/`iat` as appropriate, and test wrong issuer/audience on HTTP and WebSocket paths. | Should-fix with PR7-03 auth ticket. |
| PR7-06 | Medium | Compatibility event integrity | `/reminders/`; `reminders/views.py` | Any valid user JWT and a target CID | The non-API reminder endpoint accepts an arbitrary CID and broadcasts `reminder.new` to that room group without resolving or authorizing the room. | Serializer accepts optional CID; view saves user-owned reminder then `_broadcast_new_reminder(cid, ...)`; canonical `/api/reminders/` checks room access. | Reminder records and delete operations are scoped to the user; PR2 re-authorizes incoming WebSocket room events before delivery. | Unauthorized event injection attempt, durable attacker-owned data with foreign CID, and behavior divergence if another consumer trusts the group event. | Require an existing accessible room whenever CID is supplied and add alias parity/no-broadcast tests. | Must-fix follow-up with PR7-02 alias closure. |
| PR7-07 | Medium | Production deployment boundary | `jatte/settingsprod.py`; deployment invocation | Operator selects the documented production settings module | Production startup fails before Django checks because `AUTH_USER_MODEL` is an invalid dotted model reference and the matching app is absent from `INSTALLED_APPS`. The module also carries a stale app list, localhost database defaults, and an in-memory channel layer. | `manage.py check --deploy --settings=jatte.settingsprod` fails during app population with an invalid model reference. | Required secrets/origins and `DEBUG=False` fail closed before this point. | Operators may deploy an unusable configuration or fall back to development settings, bypassing the intended production checks. | Replace duplicated production settings with an import/override of the tested base or fully reconcile apps, database, channel layer, and auth model; add a CI production-startup/deploy-check test. | Must-fix deployment follow-up. |
| PR7-08 | Medium | Background tasks / broker trust | `chat_addons/agent/tasks.py:run_agent_invocation`; `_persist_message` | Ability to publish to the task broker, leaked broker credentials, or duplicate/retried task delivery | Task arguments are treated as authorization: arbitrary CID is canonicalized, missing rooms/channels are created, and an agent message is persisted. `run_id` is not used to load/claim an authorized `AgentRun`; retries can create duplicate messages. | Task calls `get_or_create()` for channel/room and persists solely from `cid`, `prompt`, and `meta`. | HTTP enqueue routes are authorized and throttled; broker should be private. | Broker compromise or accidental duplicate delivery becomes privileged room creation/message injection and LLM cost amplification. | Load and atomically claim a persisted authorized run, reject CID mismatch/missing run, and make completion/message persistence idempotent by run ID. | Should-fix follow-up. |
| PR7-09 | Medium | Attachment scanning | `chat/tasks.py:perform_attachment_scan` and download scan gate | Authorized upload of an allowed file type | The default scanner marks every attachment clean without inspecting bytes. Once the task runs, authenticated download is allowed as `clean`, which can create a false security assurance. | Default function returns `ATTACHMENT_SCAN_CLEAN` unconditionally. | Pending, flagged, and error downloads are blocked; MIME/size/checksum/session binding and room authorization are enforced. | Malicious content can be distributed to authorized room participants if operators believe scan status means malware scanning occurred. | Rename/configure the default as an explicit trusted/no-scan mode that does not claim `clean`, or require a real scanner in production and fail closed when absent. | Should-fix follow-up; infrastructure/product policy required. |
| PR7-10 | Low | Logging / sensitive URL data | `chat/api_views.py:LinkPreviewView._invalid_url_response` | Authenticated request containing a malformed sensitive URL | Validation failures log the complete caller-supplied URL, potentially including query credentials, reset tokens, or userinfo. | Warning format includes `url=%s` with raw input. | Endpoint does not fetch the URL; logs are server-side. | Sensitive URL material can enter centralized logs and retention systems. | Log only scheme/host or a redacted hash/length; add a log-redaction test. | Should-fix, suitable for a small standalone patch. |
| PR7-11 | Low | HTTP transport hardening | `jatte/settingsprod.py` | Network path where HTTPS redirection alone is insufficient | Production enables redirect and secure cookies but does not set HSTS duration/include-subdomains/preload, and does not explicitly set referrer/content-type hardening values. | Deployment settings inspection; deploy checks could not run because of PR7-07. | TLS redirect, secure cookies, CSRF middleware, origin allowlists, `XFrameOptionsMiddleware`, and `SecurityMiddleware`. | First-visit downgrade exposure remains deployment-dependent. | Set and stage an HSTS policy after confirming all served subdomains support HTTPS; verify with deployment checks. | Defer until production topology is confirmed. |
| PR7-12 | Low | Abuse / request sizing | Polls, reminders, generic composer/event helpers, WebSocket payloads | Authenticated user | Per-operation throttles exist for messages, reactions, agents, and SMS, but several compatibility write endpoints have no dedicated throttle and production does not explicitly cap request body size. WebSocket operation rate is bounded, but individual JSON frame size is delegated to the ASGI server/proxy. | Throttle inventory and settings review. | Authentication, serializer field limits in many paths, pagination caps, WebSocket token bucket, attachment size checks, edge proxy may impose limits. | Authenticated storage/CPU amplification and oversized payload handling vary by deployment. | Document/enforce edge and Django/ASGI body/frame limits; add throttles only to demonstrably expensive compatibility operations. | Tests-needed / bounded hardening ticket; no evidence of an unauthenticated amplification path. |
| PR7-13 | Informational | Webhook replay | SMS webhook and receipt | Signed provider callback | The inbound webhook performs a pre-check, but concurrency safety ultimately comes from a database uniqueness constraint and `IntegrityError` handling. Receipt updates accept only pending-to-terminal transitions. The provider contract has no signed timestamp. | `SmsRelay` has unique `(direction, external_id)`; webhook wraps creation in `transaction.atomic()` and converts uniqueness races to replay errors. | Exact-body HMAC, constant-time comparison, unique event identity, terminal-state replay rejection, required production secret. | Captured signed events can be replayed only until the first successful transaction; no time-based rejection is possible under the current provider contract. | Keep the DB constraint and add a true concurrent replay test; implement signed timestamps if the provider adds them. | Existing mitigation adequate; tests-needed. |
| PR7-14 | Informational | Outbound network / SSRF | Link preview, GCS verification, SMS providers, JWKS | Varies | No request-controlled server fetch was found in link preview: it validates and echoes metadata only. GCS fetches a server-generated signed storage URL. SMS/JWKS destinations come from operator settings, not request data. | Outbound-call inventory found `urlopen` only in GCS and SMS provider code; link preview performs no network I/O. | Operator-controlled endpoints and timeouts; GCS URL generated from configured bucket/object. | Misconfiguration can target internal services, but no ordinary-user SSRF primitive was identified. SMS response bodies are not explicitly bounded. | Validate production provider/JWKS schemes/hosts and cap provider response reads. | Informational / defense in depth. |
| PR7-15 | Informational | Injection / unsafe interpretation | Backend Python sources | External caller | No active raw SQL, shell execution, `eval`/`exec`, unsafe pickle/YAML load, or user-controlled dynamic import was identified in externally reachable request paths. | Repository searches plus review of dynamic extension loading and ORM paths. | ORM parameterization and fixed serializer fields. | Dynamic extension paths remain operator-controlled; regex/path routes can accept long values but are not catastrophic-backtracking patterns. | Retain static analysis and review any future tool/plugin loader exposed to request data. | No corrective action. |
| PR7-16 | Informational | Supply chain | Python and frontend lockfiles | Dependency vulnerability in deployed package | `pip-audit` is not installed in the existing environment. GitHub's Dependabot alert API reports that alerts are disabled/unavailable for this repository. No invasive dependency installation or mass upgrade was performed. | Existing-tool check and read-only GitHub API query. | Version locks exist (`requirements.txt`, `pnpm-lock.yaml`). | Current advisory status is not established by repository automation. | Enable GitHub dependency alerts or add locked Python/frontend audit jobs; triage only high/critical production findings. | Tests/tooling-needed follow-up. |

## Independently derived external surface inventory

The current root resolver was walked recursively. Classification below reflects
the first matching production route; later duplicates are called out where they
matter.

| Route family | Effective actor | Notes / alias result |
|---|---|---|
| `/`, `/about/`, `/api/tag/`, `/api/user-agent/` lightweight GET aliases | Anonymous for intentionally public metadata; authenticated for the first-resolved `/api/user-agent/` | URL ordering resolves the authenticated class before the later public helper for `/api/user-agent/`. |
| `/admin/**` | Django staff/superuser | Django admin authentication/permissions. |
| `/api/token/`, sync/session/current-user/client/connection/refresh/bootstrap aliases | Authenticated user | Refresh-token semantics are PR7-03. Duplicate auth aliases resolve consistently except for documented response adapters. |
| `/api/rooms/**`, `/rooms/**`, room members/messages/read/config/draft/mute/query/pin/archive/hide aliases | Authenticated room participant; room agent/staff for admin-like mutations | Canonical PR3 helpers are present. Root ordering places canonical chat views ahead of later lightweight duplicates. |
| `/api/messages/**`, `/messages/**`, `/threads/`, `/api/threads/`, `/search/messages/` | Authenticated participant in a parent room; author/agent/staff for mutation as applicable | Direct-ID and parent-room checks remain in place. |
| `/api/attachments/**`, `/attachments/**` | Authenticated room participant/uploader; parent-room access on download | Sign/commit aliases resolve to the same PR4 views. Private download is default. |
| `/api/polls/**` | Authenticated user only (incorrect) | Legacy chat poll model is unbound to rooms; PR7-01. |
| `/polls/**` | Authenticated user only (incorrect) | CID-bearing poll implementation lacks room authorization; PR7-01. |
| `/api/reminders/**`, `/api/rooms/**/reminders/` | Authenticated room participant | Canonical implementation checks room access. |
| `/reminders/**` | Authenticated user; record owner on delete | Optional CID is not room-authorized before broadcast; PR7-06. |
| `/api/recover-state/` | Authenticated user, accessible rooms only | Canonical implementation is scoped. |
| `/recover-state/` | Authenticated user (incorrectly all rooms) | Later state-app alias is independently reachable; PR7-02. |
| event/subscription/listener/notification aliases | Authenticated user | Stored subscription/notification state is user-scoped; generic dispatch is echo/user-owned storage rather than room broadcast. |
| mute/user-directory aliases | Authenticated user | User directory exposes minimal global identities by current product policy; mute state is caller-scoped. |
| `/chat/agent/**`, `/api/chat/agent/**` | Room participant for allowed invoke; room agent/staff for controls; staff for simulation/runs/memory as implemented | The add-on include precedes legacy chat duplicates; effective invoke route is the secured LLM view. One doubled path (`/chat/agent/chat/agent/...`) exists but uses the same secured classes. |
| `/chat/admin/**` | Staff/superuser | Queue, claim, reset, gating, intake, run debug, audit. |
| `/chat/notifications/**` | Staff or internal service | Explicit service authentication only on opted-in routes. |
| `/chat/integrations/sms/send/` | Staff or internal service | Dedicated throttle and audit trail. |
| `/chat/integrations/sms/webhook/` | External signed provider | Browser JWT is not accepted; exact-body HMAC and DB-backed replay identity. |
| `/chat/integrations/sms/receipt/` | External signed provider or internal service | Pending-to-terminal status transition only. |
| `/ws/<room_key>/?token=...` including `/ws/chat/` | Valid Supabase JWT; authorized room watch before room group access | OriginValidator, pre-accept JWT validation, room reauthorization, and per-socket token bucket remain active. |

No static/media download route is registered in the root URLconf. Django admin is
the only HTML/session-authenticated privileged surface. The compatibility API
uses bearer authentication, so CSRF-exempt helper functions that are not routed
do not become cookie-authenticated mutations.

## Lens-specific evidence and negative results

### Object authorization and mass assignment

PR3 helpers cover canonical room/message, thread/reply, reaction, pin, draft,
search, count, and attachment parent-object access. Message create/update keeps
sender, deletion/hidden fields, attachment integrity, and parent-room binding
server-controlled. Pin fields are writable only through update serializers, but
both effective update views independently require `can_admin_room()` when those
fields are present. Room serializers expose writable administrative fields, but
the effective create/update views constrain ownership and administrative
mutations rather than blindly calling `serializer.save()` with arbitrary input.

The material neighboring omissions are the two poll systems and the state and
reminder aliases recorded above. Reminder deletes remain owner-scoped. SMS
external IDs are protected by direction-scoped uniqueness. Agent run/memory
HTTP views resolve CID and enforce PR5 role checks; the remaining trust gap is
the broker task itself.

### Authentication, CSRF, CORS, host, origin, and proxy

The shared decoder restricts algorithms to HS256 or RS256/JWKS, verifies the
signature, enforces expiry when supplied, uses 30 seconds of leeway, requires
`sub`, and never maps JWT claims to Django staff/superuser flags. It does not
enforce issuer, audience, or required expiry, leading to PR7-03/05.

Production configuration requires explicit host, CORS, and WebSocket origin
lists and rejects wildcards. Credentialed CORS is disabled. CSRF middleware and
CSRF-enforcing session authentication remain enabled, while API mutations rely
on bearer tokens. `OriginValidator` protects WebSockets. Proxy TLS is trusted via
`SECURE_PROXY_SSL_HEADER`; deployments must prevent clients from bypassing or
spoofing the trusted proxy. `USE_X_FORWARDED_HOST=True` remains bounded by
`ALLOWED_HOSTS`. Production readiness cannot currently be proven because of
PR7-07.

WebSocket JWTs appear in query strings by frontend contract. The consumer does
not log the query string or token, but reverse proxies/access logs must redact
`token` parameters. No backend logger was found emitting Authorization or
service-token headers.

### Webhooks, tasks, outbound requests, and attachment state

SMS signature validation uses constant-time exact-body HMAC. Concurrent inbound
replays converge on a database uniqueness constraint, not only a pre-check.
Receipt callbacks accept only delivered/failed and reject updates after leaving
pending. The provider contract represented in this repository has no signed
timestamp.

Attachment sign/commit binds user, blob, size, MIME, checksum, CID, room, and
message; successful commits are idempotent and private download rechecks current
parent-room access. Download blocks pending, flagged, and error states. No path
traversal was found in server-generated blob names, and signed URL TTLs are
bounded. The residual scanner-default issue is PR7-09.

Link preview does not fetch user URLs. SMS and JWKS destinations are deployment
configuration, and GCS verification downloads only a server-generated signed
object URL. No ordinary-user SSRF path was confirmed.

### Abuse controls

Messages and reactions have burst/sustained throttles; agent invoke/control,
admin writes, and SMS send use dedicated rate throttles; WebSockets use a token
bucket; attachments enforce size and session TTL; major lists cap page size.
Residual deployment-level body/frame limits and unthrottled low-cost
compatibility writes are recorded as PR7-12 rather than overstated as an active
availability vulnerability.

## Test-gap challenge

PR1-PR6 tests strongly cover canonical negative and successful contracts, but
several use focused test URLconfs. The material gaps are:

1. Real-root-URLconf parity tests for `/recover-state/`, `/reminders/`, and both
   poll families.
2. Cross-room poll list/create/option/vote/answer/delete tests and absence of
   side effects.
3. Refresh-token tests requiring expiry/issuer/audience and rejecting a locally
   minted indefinite token.
4. A production settings startup plus `check --deploy` CI test.
5. Concurrent SMS webhook replay testing rather than sequential duplicate-only
   tests.
6. Broker-task idempotency and CID/run binding tests.
7. A test proving production cannot mark an attachment clean without an
   explicitly configured scanner/no-scan policy.
8. Log-redaction tests for URLs and query-string WebSocket tokens at the
   application/proxy boundary.

## Dependency triage

The existing environment does not include `pip-audit`. GitHub Dependabot alerts
are disabled or inaccessible for this repository, so no supported advisory feed
was available without installing new tooling. Lockfiles were present and no
broad dependency changes were made. Enabling repository-native advisory checks
is recommended as bounded follow-up work.

## Final disposition

No Critical finding was identified. All High findings are explicitly triaged as
must-fix follow-up work. PR7 makes no direct runtime change: the material items
cross auth-contract, model/policy, credential-rotation, or production-settings
boundaries and would not be safely closed by opportunistic audit patches.

## Bounded corrective ticket drafts

GitHub Issues are disabled for this repository, so these could not be opened as
issue records during PR7. They are kept here as ready-to-transfer tickets; no
finding is left without an ownerable scope.

1. **Bind all poll APIs to authorized rooms** (PR7-01): choose the canonical
   poll model/policy; bind every poll to an existing room; authorize all list,
   create, option, vote, answer, count, cursor, and delete paths; test every
   production alias and absence of denied side effects.
2. **Close state and reminder compatibility alias authorization gaps**
   (PR7-02/06): scope `/recover-state/` with `rooms_accessible_to_user()` and
   require existing-room access before `/reminders/` accepts CID or broadcasts;
   add real-root-URLconf parity tests.
3. **Remove indefinite local refresh tokens and enforce JWT authority claims**
   (PR7-03/05): stop minting Supabase-equivalent indefinite tokens; define the
   refresh compatibility contract; require expiry, issuer, and audience for
   HTTP/WebSocket tokens; cover wrong/missing claims.
4. **Rotate tracked database credential material** (PR7-04): validate exposure,
   rotate/revoke, inspect access logs, remove current-tree material, and decide
   approved history remediation without copying the secret into tickets/logs.
5. **Make production settings bootable and continuously deploy-checked**
   (PR7-07/11): reconcile the auth model, app list, database, channel layer, and
   transport settings; run production import and `check --deploy` in CI.
6. **Bind agent background work to authorized idempotent runs** (PR7-08):
   atomically claim an authorized persisted run, verify CID, reject forged or
   terminal work, avoid broker-driven room creation, and deduplicate retries.
7. **Require an explicit production attachment scanner policy** (PR7-09): use a
   real configured scanner or represent no-scan mode without a clean verdict;
   preserve fail-closed downloads and test state transitions.
8. **Residual defense-in-depth hardening** (PR7-10/12/13/16): redact URLs,
   enforce/document body and frame limits, add concurrent webhook replay tests,
   and enable repository-native dependency advisory checks.
