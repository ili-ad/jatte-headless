# Phase 2 Backlog (A–I)

A. **Spec groundwork for moderation & room visibility**  
   *Scope:* Add OpenAPI documentation for message flagging, room hide/show, and moderation response shapes ahead of implementation.【F:backend/chat/api_views.py†L650-L1297】  
   *Ops:* Schema review signed off with logging requirements captured.  
   *WS:* N/A (documentation only).  
   *Done-when:* `openapi/phase2.patch.yml` covers existing moderation endpoints with example payloads.

B. **Moderation ban & hide persistence**  
   *Scope:* Introduce REST endpoints to create/list/delete room bans and message hides backed by `RoomMemberMute`/future ban models; extend serializers to return `banned` truthfully.【F:backend/chat/api_views.py†L1004-L1013】【F:backend/chat/tests/test_members.py†L22-L133】  
   *Ops:* Ban actions audited with request IDs and stored user metadata.  
   *WS:* Emitting `user.banned` / `member.banned` events when bans mutate membership.  
   *Done-when:* Acceptance tests confirm banned users are excluded from members endpoints and WS events propagate to clients.

C. **Moderation WebSocket events**  
   *Scope:* Extend `ChatConsumer` (and channel groups) to broadcast `message.hidden`, `message.flagged`, and `room.hidden` events alongside moderation metadata.【F:backend/chat/consumers.py†L13-L120】  
   *Ops:* Events include correlation IDs for tracing.  
   *WS:* New event types documented and delivered to watchers.  
   *Done-when:* WebSocket contract tests cover event emission on moderation actions.

D. **Server-side message search (GET)**  
   *Scope:* Build `GET /api/search/messages/` with `q`, `cid`, `user_id`, `before`, `after`, pagination; replace shimbed `chatAPI.search` usage.【F:libs/stream-chat-shim/src/api/chatAPI.ts†L2278-L2322】【F:backend/chat/serializers.py†L24-L101】  
   *Ops:* Query logs capture request ID, latency, and result count.  
   *WS:* Optional `search.results.ready` documented (no emission in this ticket).  
   *Done-when:* Integration tests validate filtering/pagination and shim calls backend endpoint.

E. **Search indexing hook**  
   *Scope:* Introduce DB index/FTS adapter over `Message` table to power search, including attachments/previews metadata.【F:backend/chat/models.py†L20-L43】【F:backend/chat/serializers.py†L24-L101】  
   *Ops:* Metrics capture search throughput/errors.  
   *WS:* If asynchronous indexing is needed, emit `search.index.updated` heartbeat.  
   *Done-when:* Query planner uses new index and tests confirm improved performance via explain plans.

F. **Health & readiness probes**  
   *Scope:* Add `GET /healthz` and `GET /readyz` endpoints plus middleware to attach `X-Request-Id` to all responses.【F:backend/chat/consumers.py†L13-L120】  
   *Ops:* Probes integrated into deployment runbooks with alerting.  
   *WS:* Future server-initiated frames include request ID metadata when available.  
   *Done-when:* Probe endpoints return 200 in healthy state and fail when DB/queue unavailable.

G. **Notification store API & events**  
   *Scope:* Provide REST/WS hooks so `notifications.store` can persist moderation/search notices, replacing fallback store usage.【F:libs/stream-chat-shim/src/chatSDKShim.ts†L2521-L2583】【F:frontend/src/lib/stream-adapter/ChatClient.ts†L427-L690】  
   *Ops:* Notification mutations logged and rate-limited.  
   *WS:* Emit `notification.new` frames when store updates.  
   *Done-when:* Client state store hydrates from backend responses/events without stub fallback.

H. **Rate limiting & counters**  
   *Scope:* Implement per-user/channel throttles for moderation/search endpoints and expose Prometheus counters for `message.new`, `reaction.new`, and moderation actions.【F:backend/chat/api_views.py†L1056-L1065】【F:backend/chat/consumers.py†L13-L120】  
   *Ops:* Dashboards visualize rate-limit usage and event volumes.  
   *WS:* Rate-limit exceedances surface via error events (`event.type = 'error'`).  
   *Done-when:* Limits enforced in tests and metrics exported to monitoring backend.

I. **Attachment validation & scanning**  
   *Scope:* Extend attachment upload schema with `size`, `mime_type`, `status`, and optional scan callbacks; enforce limits and emit scan outcomes.【F:backend/chat/api_views.py†L1218-L1245】【F:backend/chat/tests/test_attachments.py†L15-L40】  
   *Ops:* Upload attempts exceeding policy produce structured error logs.  
   *WS:* Broadcast `attachment.scanned` or reuse moderation events upon scan completion.  
   *Done-when:* Upload tests cover limit enforcement and WS notifications update clients.
