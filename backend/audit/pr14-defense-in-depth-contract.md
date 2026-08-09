# PR14 defense-in-depth contract

## Sensitive logging inventory

The backend was searched for request-controlled URLs, URIs, full paths, query
strings, signed attachment URLs, WebSocket URLs, Authorization headers and
bearer values. The actionable raw-value sink was `LinkPreviewView`'s rejected
URL warning. It now records only validation reason, request ID, scheme,
hostname, input length and a 12-hex SHA-256 correlation fingerprint. Userinfo,
path, query, fragment and the complete URL are never logged. Attachment signing
and scanner code does not log signed URLs or bearer/identity tokens; PR10's
WebSocket authentication logging remains token-free.

## Bounded request and WebSocket resources

- Django request bodies: 2 MiB, enforced before parsing by
  `RequestBodyLimitMiddleware` and mirrored by
  `DATA_UPLOAD_MAX_MEMORY_SIZE`. Nginx also declares
  `client_max_body_size 2m`. Direct PR13 attachment bytes use signed GCS PUTs
  and do not traverse this boundary.
- Daphne 4.2.3: 1 MiB maximum frame and 1 MiB maximum assembled message.
- Chat consumer: 256 KiB maximum encoded event before JSON decoding; oversized
  input closes with RFC 6455 code 1009 and performs no dispatch.
- HTTP execution: Daphne `--http-timeout 60`, Gunicorn `TIMEOUT=60`, and Nginx
  send/read timeout 60 seconds. WebSocket lifetime remains unlimited; handshake
  timeout is 20 seconds and application cleanup timeout is 10 seconds.

These values are tracked in `backend/serverfiles/`. Any external deployment
system that replaces those commands must preserve equivalent or stricter
limits.

## SMS concurrency boundary

Inbound replay authority remains the database uniqueness constraint on
`(direction, external_id)`. A PostgreSQL `TransactionTestCase` sends two signed
requests through independent connections and proves one 200, one 409, one
relay/message and one broadcast. Integrity races are converted to the normal
replay response.

Delivery receipts now lock the outbound `SmsRelay` with
`select_for_update()` inside `transaction.atomic()`. Only the transaction that
observes `pending` updates message/relay state; its broadcast occurs after the
atomic state update. The PostgreSQL concurrent test proves one transition and
one broadcast while the loser returns 409 without an exception.

## Dependency advisory baseline

The active dependency workflow pins `pip-audit==2.9.0` and runs both
`pip-audit -r backend/requirements.txt` and
`pnpm audit --prod --audit-level high` weekly, on main and on relevant pull
requests. The PR14 baseline is zero known Python advisories and zero
High/Critical production JavaScript advisories. Remaining JavaScript findings
are below the blocking threshold. Dependabot covers `/backend` pip manifests
and the root npm/pnpm workspace weekly.

Security-compatible updates include Daphne 4.2.3, Django 5.2.16 and patched
Python cryptography/JWT/image/network dependencies, plus Next.js 15.5.21 and
patched Axios, form-data, JWS, NanoID, PostCSS, Sharp and ws resolutions.

## HSTS deployment decision (2026-08-09)

The tracked Nginx file names `jatte.com`, but the repository contains no
authoritative current deployment inventory, certificate configuration, DNS
ownership record, or evidence that this is the deployed JATTE hostname.
Read-only DNS/HTTP inspection found multiple parking-style addresses, an HTTPS
certificate chain that did not validate, and an HTTP 204 response advertising
`Strict-Transport-Security: max-age=0; includeSubDomains; preload`. That is not
evidence of a permanently HTTPS-only JATTE deployment.

Accordingly the safe staged decision is:

- retain the positive host-only one-hour default (`3600`) with environment
  override;
- keep `SECURE_HSTS_INCLUDE_SUBDOMAINS=False`, because all affected subdomains
  have not been proven HTTPS-capable;
- keep `SECURE_HSTS_PRELOAD=False`, because the domain owner has not made an
  intentional preload commitment and the technical prerequisites are not
  established.

The 30-day ratchet is deferred until the authoritative production hostname and
certificate/proxy topology are verified. Django deploy warnings W005/W021 are
therefore expected and deliberately not silenced.
