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

The direct major updates were security-driven rather than general
modernization: Daphne 4.2.3 is the maintained release required for the bounded
WebSocket server contract; Django 5.2.16 resolves advisories present across the
old 4.2 pin while retaining the repository's supported Django APIs; and Next.js
15.5.21 resolves High/Critical production advisories affecting the prior
15.3.3 release. DRF 3.15.2 and the Python cryptography/JWT/image/network pins
were compatibility/security-supported baselines selected by the resolver.
Autobahn, Twisted, asgiref and the remaining Python leaf updates are resolver
collateral required by those maintained direct versions. JavaScript overrides
are narrowly pinned to fixed versions reported by the production advisory
audit.

## CI activation and frontend compatibility

GitHub Actions was registered but disabled at the repository boundary before
this corrective pass (`enabled=false`), explaining why the active
`production-settings.yml` had no historical runs. It was enabled on 2026-08-09
with `allowed_actions=selected`; only GitHub-owned actions and actions from
verified creators are permitted, with the exact additional allowlist pattern
`pnpm/action-setup@v4` needed by the JavaScript audit job. Workflow token
permissions remain read-only.
The production and dependency workflow run IDs and conclusions are recorded
below after the corrective commit's pull-request synchronization event:

- production settings: run `31306751142`, success (both
  `production-boundary` and `attachment-scanner-iac`)
- dependency security / Python: pending corrective commit run
- dependency security / JavaScript: pending corrective commit run

Frontend compatibility was checked with Node 24.18.0 and pnpm 10.12.2 in clean
PR and base worktrees. PR14 passes `pnpm install --frozen-lockfile`; the base
cannot because its lockfile records React 18.2.0 while its frontend manifest
requests 18.3.1. A disposable non-frozen base install proves the existing
Vitest adapter failures (stale non-`/api/` URL and plain-object header
expectations) and broad TypeScript shim errors are present at the base SHA.
PR14's Next.js update initially exposed stricter route-module/dynamic-parameter
contracts; the affected route and page now satisfy Next.js 15.5 without
changing their external behavior.

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
