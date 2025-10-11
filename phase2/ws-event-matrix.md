# Phase 2 WebSocket Event Matrix

| Event | Source | Trigger | Payload (key fields) | Notes |
|-------|--------|---------|----------------------|-------|
| `initialized` | Server (`ChatConsumer`) | Client sends `channel.watch` | `{ type, cid, initialized, messages[], next, members[] }` | Baseline channel bootstrap today.【F:backend/chat/consumers.py†L70-L108】 |
| `message.new` | Server (`ChatConsumer`) | Client sends `message.new` | `{ type, cid, text, user }` | Emits without correlation IDs yet; Phase 2 adds request metadata.【F:backend/chat/consumers.py†L96-L109】 |
| `typing.start` / `typing.stop` | Server (`ChatConsumer`) | Client typing activity | `{ type, user_id, cid? }` | Currently scoped per-channel or lobby.【F:backend/chat/consumers.py†L111-L120】 |
| `user.join` / `user.leave` | Server lobby group | WebSocket connect/disconnect | `{ type, user }` | Broadcast on shared lobby group for presence.【F:backend/chat/consumers.py†L35-L67】 |
| `message.flagged` | Planned (ChatConsumer + notifications) | `POST /api/messages/{id}/flag/` succeeds | `{ type, cid, message_id, flag { id, user_id, created_at } }` | Extends existing flag API to broadcast moderation outcomes.【F:backend/chat/api_views.py†L650-L659】【F:backend/chat/serializers.py†L263-L269】 |
| `message.hidden` | Planned | Message hide endpoint toggles visibility | `{ type, cid, message_id, hidden_by, hidden_at, reason? }` | Complements room/message hide actions for moderation UI.【F:backend/chat/api_views.py†L1270-L1297】 |
| `room.hidden` / `room.visible` | Planned | Room hide/show endpoints | `{ type, cid, hidden, actor, ts }` | Alerts other members when room is hidden or restored.【F:backend/chat/api_views.py†L1270-L1297】 |
| `user.banned` | Planned | Room ban created | `{ type, cid, user_id, banned_until?, reason }` | Drives removal from member lists backed by ban persistence.【F:backend/chat/api_views.py†L1004-L1013】【F:backend/chat/tests/test_members.py†L22-L133】 |
| `member.banned` | Planned | Agent moderates another member | `{ type, cid, moderator_id, target_id, banned: true }` | Allows clients to update participant rosters in real time.【F:backend/chat/tests/test_members.py†L22-L133】 |
| `search.results.ready` | Planned | Async search completes | `{ type, request_id, cid?, next?, messages[] }` | Optional notification when search processing becomes async; pairs with new search endpoints.【F:libs/stream-chat-shim/src/api/chatAPI.ts†L2278-L2322】 |
| `attachment.scanned` | Planned | Virus scan finishes | `{ type, attachment_id, status, details }` | Announces scan outcome for uploads now limited via REST.【F:backend/chat/api_views.py†L1218-L1245】 |
| `notification.new` | Planned | Backend enqueues moderation/search notification | `{ type, notification }` | Hydrates `notifications.store` without relying on fallback store.【F:libs/stream-chat-shim/src/chatSDKShim.ts†L2521-L2583】【F:frontend/src/lib/stream-adapter/ChatClient.ts†L427-L690】 |
