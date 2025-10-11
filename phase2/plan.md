# Phase 2 Discovery Plan

## Overview
Phase 2 focuses on three surface areas that remain partially stubbed in the shim: moderation & safety workflows, full-text search/indexing, and operability (health/rate-limit/observability). We also scope attachment hardening because upstream clients expect guardrails before moderation tooling can be effective. This plan inventories existing code, identifies hook points, and proposes additive interfaces for implementation in later phases.

## Moderation & Safety
### Current surface & gaps
- Messages can already be flagged via `POST /api/messages/{message_id}/flag/`, which persists a `Flag` record and responds with serialized data.【F:backend/chat/api_views.py†L650-L659】【F:backend/chat/models.py†L146-L150】【F:backend/chat/tests/test_flag_message.py†L12-L34】
- Rooms can be hidden or shown for the current user, but only mutate a `hidden` flag on room JSON without audit trails or broadcast events.【F:backend/chat/api_views.py†L1270-L1297】 Members listing returns `banned: False` placeholders without enforcement, indicating bans are unimplemented.【F:backend/chat/api_views.py†L1004-L1013】【F:backend/chat/tests/test_members.py†L22-L133】
- Notifications are fetched over REST (`GET /api/notifications/`) and cached client-side, yet there is no write surface or WebSocket propagation for moderation actions.【F:backend/chat/api_views.py†L1056-L1065】【F:frontend/src/lib/stream-adapter/ChatClient.ts†L427-L690】

### Proposed Phase 2 surface
- Extend REST spec with dedicated moderation endpoints:
  - `POST /api/messages/{message_id}/flag/` (document existing behavior).
  - `POST /api/messages/{message_id}/hide/` and `POST /api/messages/{message_id}/show/` (soft hide/restore content without deletion).
  - `POST /api/rooms/{room_uuid}/moderation/bans/` & `DELETE /api/rooms/{room_uuid}/moderation/bans/{user_id}/` to persist bans against `RoomMemberMute` or future ban model.
  - `POST /api/rooms/{room_uuid}/moderation/hide/` (document existing hide) plus audit fields.
- Surface moderation state over WebSocket with new events: `message.hidden`, `message.flagged`, `user.banned`, `member.banned`, and `room.hidden`. Consumers should enrich payloads with `moderation` metadata so clients can localize actions.
- Introduce moderation review queue via notifications: allowing `notifications.store` hook to receive moderation tasks when the backend enqueues a new review item.

### Ops / WS / Done-when
- **Ops:** Moderation actions are logged with request IDs; bans are persisted and retrievable; admins can query flagged/hide state for audit.
- **WS:** When a moderation action is taken, the relevant WebSocket event (e.g., `message.hidden`, `user.banned`) reaches all affected clients and updates notification queues.
- **Done-when:** REST + WS payloads align with documented schemas, moderation state survives restarts, and adapter hooks (e.g., `flagMessage`, `notifications.store`) no longer rely on stubs.

## Indexing & Search
### Current surface & gaps
- The shim implements `chatAPI.search` entirely client-side by scanning cached channel state, returning empty results when no channels are cached.【F:libs/stream-chat-shim/src/api/chatAPI.ts†L2278-L2322】 There is no server endpoint, no pagination cursor, and no filtering by user or time.
- Message serialization already exposes text, attachments, and preview data suitable for indexing.【F:backend/chat/serializers.py†L24-L101】 Messages live in Postgres models with author and timestamp metadata.【F:backend/chat/models.py†L20-L43】

### Proposed Phase 2 surface
- Add `GET /api/search/messages/` with query parameters `q`, `cid`, `user_id`, `before`, `after`, `limit`, and `offset` to provide minimal full-text search. Responses return `messages` (lightweight message summary), `next` cursor, and optional `hits` metadata for UI scoring.
- Add optional `POST /api/search/messages/` accepting the same filters in JSON to enable complex clients and long query payloads.
- Wire search results to WebSocket `search.results.ready` (optional) so long-running searches can stream results; otherwise rely on synchronous HTTP.
- Backend hook: wrap Django ORM with PostgreSQL full-text search or fallback to `icontains` for MVP. Index `Message.body`, attachments names, and preview titles.

### Ops / WS / Done-when
- **Ops:** Search queries include `X-Request-Id`; logs record latency; rate limits prevent abuse.
- **WS:** Optional `search.results.ready` frames allow clients to subscribe when asynchronous indexing is introduced.
- **Done-when:** HTTP endpoint returns deterministic results filtered by cid/user/time, passes pagination tests, and replaces shim stub.

## Operability & Observability
### Current surface & gaps
- WebSockets broadcast `initialized`, `message.new`, `typing.start/stop`, and presence joins/leaves, but there is no health/readiness probe or operational metrics.【F:backend/chat/consumers.py†L13-L120】
- Attachments and notifications endpoints provide basic functionality but do not emit request IDs, rate-limit headers, or counters.

### Proposed Phase 2 surface
- Add `GET /healthz` (shallow check) and `GET /readyz` (database check, queue connectivity).
- Standardize headers: respond with `X-Request-Id` (generate if absent) and `X-RateLimit-Limit/Remaining/Reset` for throttled endpoints.
- Instrument counters (Prometheus or StatsD) for `message.new`, `reaction.new`, moderation events, and search queries.
- Ensure `notifications.store` has a documented REST/WS feed to hydrate the client’s state store.

### Ops / WS / Done-when
- **Ops:** Dashboards show healthz/readyz status, counter metrics emit per event type, logs correlate via request IDs.
- **WS:** Presence and message events include correlation metadata when applicable (e.g., request ID in frame meta for server-originated events).
- **Done-when:** Probes integrate with deployment orchestrator, headers are verified in integration tests, and metrics events are captured in telemetry stubs.

## Attachment Hardening
### Current surface & gaps
- `POST /api/attachments/` only requires a name and returns a synthetic URL, with unit tests confirming no size/type enforcement.【F:backend/chat/api_views.py†L1218-L1245】【F:backend/chat/tests/test_attachments.py†L15-L40】 There is no scanning hook or storage integration.

### Proposed Phase 2 surface
- Extend spec to accept metadata (`size`, `mime_type`, optional checksum`) and enforce configurable limits (e.g., 20 MB max, allowed MIME patterns).
- Add optional virus-scan callback contract: backend returns `status: pending` with `scan_url` for asynchronous scanners; upon completion, enqueue `attachment.scanned` WS events when a file is quarantined or approved.
- Update attachment schema to include `status`, `size`, and `mime_type` so moderation can filter suspicious uploads.

### Ops / WS / Done-when
- **Ops:** Upload attempts exceeding limits are rejected with clear error codes and logged; scan outcomes recorded for audit.
- **WS:** `attachment.scanned` (or reuse moderation events) notifies clients when uploads are cleared/quarantined.
- **Done-when:** Attachment endpoint validates size/type, returns scan status fields, and WS/notification flows propagate scan outcomes.

## Sequencing & Dependencies
1. **Spec & schema groundwork** – land OpenAPI additions for moderation/search/operability so downstream work can scaffold tests.
2. **Operability foundations** – add request ID middleware, rate-limit headers, and health endpoints to support later load testing.
3. **Search service** – implement indexed queries, then plumb adapters to new REST surface.
4. **Moderation workflows** – build ban/hide APIs, integrate with notification store, and emit WS events.
5. **Attachment hardening** – enforce limits once moderation/search surfaces rely on trustworthy metadata.

Risks include data model churn (adding ban tables), search performance without indexes, and coordinating WS schema changes across adapters. Mitigation: prototype schema updates behind feature flags and ship integration tests alongside each surface.
