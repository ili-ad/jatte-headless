# ChatKit contract audit: identifiers, endpoints, and minimal payloads

## Identifier lifecycle (current vs. required)
- **Entrypoint label supplied by UI:** Components pass `roomSlug` such as `"agent-lab"` into `ChatProvider` (e.g., `/app/agent/page.tsx`). The slug is forwarded directly to the chat adapter as the channel identifier without any resolution step. 【F:src/app/agent/page.tsx†L15-L20】【F:src/lib/ChatProvider.tsx†L117-L129】
- **Backend response today:** No explicit room-lookup call is made. `channelFactory.call(client, 'messaging', roomSlug)` assumes the slug *is* the room UUID, so the backend must already recognize that identifier.
- **Persistence:** There is no cookie/localStorage storage of a room UUID. Changing pages recreates the channel using the provided slug; if the slug is not a stable per-user UUID, the conversation will not resume.
- **Required future behavior:** Treat the entrypoint label (e.g., `agent-lab`) as a bootstrap hint only. The client should call a **room resolve/create** endpoint to obtain a per-user `room_uuid`, persist it (cookie/localStorage, e.g., `jatte.room_uuid`), and reuse that UUID for all subsequent calls (`config-state`, message list/send, websocket `cid`).
- **Agent lab special-casing:** Agent helpers infer AI enablement whenever `channel.uuid === 'agent-lab'` or `cid === 'messaging:agent-lab'`, reinforcing that the entrypoint slug is currently treated as the room id. This logic would need to switch to the resolved room UUID. 【F:src/lib/stream-adapter/channelAgentExtensions.ts†L77-L104】

### Expected bootstrap flow
1. UI mounts chat (chat bubble/page) with an entrypoint label (`agent-lab`).
2. Call **resolve** endpoint: `POST /api/rooms/resolve/` (or equivalent) with `{ label: "agent-lab" }` → returns `{ room_uuid }` (create-if-missing per user/session).
3. Persist `room_uuid` in cookie/localStorage and reuse it site-wide.
4. Initialize Channel using the UUID, then fetch:
   - `GET /api/rooms/{room_uuid}/config-state/`
   - `GET /api/rooms/{room_uuid}/messages/`
5. Render history; websocket/watch uses `messaging:{room_uuid}`.
6. Send new messages via `POST /api/rooms/{room_uuid}/messages/`; list updates via echo response or websocket.

## Endpoint catalogue (frontend expectations)
All calls go through the Next proxy at `/app/api/rooms/[...path]`, which forwards to `${BACKEND}/api/rooms/{...}/` while passing through `Authorization` and the request body. 【F:src/app/api/rooms/[...path]/route.ts†L4-L31】 Unless noted, requests rely on `apiFetch` to inject the bearer token and to raise `AuthError` with a toast on 401/403. 【F:src/lib/api.ts†L12-L45】

### Resolve / bootstrap (missing today)
- **Purpose:** Map entrypoint label → per-user/per-session `room_uuid`, creating the room if needed. Not implemented in the current frontend; must be added to support UUID-based rooms.
- **Expected contract (to add):**
  - `POST /api/rooms/resolve/`
  - Body: `{ label: string }`
  - Response: `{ room_uuid: string, name?: string }`
  - Persist `room_uuid` client-side for reuse.

### Config state
- **Call sites:** `Channel#getConfigState` (invoked by `ChatProvider` bootstrap and background refresh). 【F:src/lib/ChatProvider.tsx†L170-L219】【F:src/lib/stream-adapter/Channel.ts†L543-L629】
- **Method / path:** `GET /api/rooms/{room_uuid}/config-state/`
- **Headers:** `Authorization: Bearer <token>` (set explicitly); `Content-Type` defaults to `application/json` via `apiFetch`.
- **Request body:** none.
- **Response usage:**
  - Reads `composer` object (or top-level fields) and consumes `file_uploads` (boolean), `max_length` (number), `cooldown_seconds` (number). Defaults to prior snapshot when missing. 【F:src/lib/stream-adapter/Channel.ts†L588-L620】
- **Error handling:** Non-2xx throws with attached `status`; ChatProvider retries with backoff, then surfaces `retryable`/`error` state. Auth errors propagate via `AuthError` toast. 【F:src/lib/ChatProvider.tsx†L170-L219】【F:src/lib/api.ts†L12-L45】

### List messages
- **Call sites:** `Channel#query` (manual fetch) and `Channel#watch` bootstrap both call the same endpoint to hydrate history. 【F:src/lib/stream-adapter/Channel.ts†L949-L1032】
- **Method / path:** `GET /api/rooms/{room_uuid}/messages/`
- **Headers:** `Authorization: Bearer <token>`.
- **Request body:** none.
- **Response usage:** Expects an array of `Message` objects with at least `id`, `text`, `user_id`, `created_at` (and optionally `updated_at`, `deleted_at`, `event`). Results populate `messages` and `latestMessages`; marks current user as read immediately. 【F:src/lib/stream-adapter/types.ts†L10-L23】【F:src/lib/stream-adapter/Channel.ts†L953-L986】【F:src/lib/stream-adapter/Channel.ts†L996-L1017】
- **Error handling:** Network errors ignored; non-2xx simply skip updates (no retries). Auth errors bubble from `apiFetch`.

### Send message
- **Call sites:** `Channel#sendMessage` invoked by the ChatKit composer. 【F:src/lib/stream-adapter/Channel.ts†L1410-L1449】
- **Method / path:** `POST /api/rooms/{room_uuid}/messages/`
- **Headers:** `Content-Type: application/json`; `Authorization: Bearer <token>`.
- **Request body shape:** `{ body: string, text: string, client_generated_id?: string, pending_message_metadata?: { client_generated_id }, custom_data?: object, poll?: object, reply_to?: string, show_in_channel?: boolean }`.
- **Response usage:** Expects a message object (fields as above) and optionally `client_generated_id`; replaces optimistic entry and emits `message.new`.
- **Error handling:** Throws on non-2xx; Auth errors bubble.

### Ancillary room calls observed (not required for echo MVP)
- Members: `GET /api/rooms/{room_uuid}/members/` to build `members` map during bootstrap. 【F:src/lib/stream-adapter/Channel.ts†L977-L985】【F:src/lib/stream-adapter/Channel.ts†L1019-L1027】
- Draft clear: `DELETE /api/rooms/{room_uuid}/draft/` when composer clears. 【F:src/lib/stream-adapter/Channel.ts†L137-141】
- AI helpers: Agent invocation endpoints use the channel `cid`; these currently treat `agent-lab` as the identifier and would need to accept the resolved UUID.

## Call-site index (frontend)
- **Channel construction:** `ChatProvider` creates `Channel` with `roomSlug` and calls `watch()`. 【F:src/lib/ChatProvider.tsx†L117-L129】
- **Config-state fetch:** `Channel#getConfigState` called from `ChatProvider` bootstrap and refresh loop. 【F:src/lib/ChatProvider.tsx†L170-L219】【F:src/lib/stream-adapter/Channel.ts†L543-L629】
- **Message list:** `Channel#query` and `Channel#watch` fetch `/messages/` to hydrate history. 【F:src/lib/stream-adapter/Channel.ts†L949-L986】【F:src/lib/stream-adapter/Channel.ts†L996-L1017】
- **Send message:** `Channel#sendMessage` posts to `/messages/` with composed payload. 【F:src/lib/stream-adapter/Channel.ts†L1410-L1449】
- **Agent auto-invoke heuristic:** `channelAgentExtensions.ts` checks `uuid === 'agent-lab'` before invoking AI. 【F:src/lib/stream-adapter/channelAgentExtensions.ts†L77-L104】

## Minimal echo-mode response shapes
- **Config state:** `{ composer: { file_uploads?: boolean, max_length?: number, cooldown_seconds?: number } }` (or these fields at top-level). Missing fields fall back to prior snapshot; no AI state expected from this endpoint. 【F:src/lib/stream-adapter/Channel.ts†L588-L620】
- **Message list item:** `{ id: string, text: string, user_id: string, created_at: string, updated_at?: string, deleted_at?: string, event?: object }`. Needed to render history and set read state. 【F:src/lib/stream-adapter/types.ts†L10-L23】【F:src/lib/stream-adapter/Channel.ts†L953-L986】
- **Send message response:** Same shape as message list; `client_generated_id` may be echoed back to reconcile optimistic sends. 【F:src/lib/stream-adapter/Channel.ts†L1410-L1449】
- **Room metadata (future resolve):** `{ room_uuid: string, name?: string }` sufficient to create `messaging:{room_uuid}` and label the room.

## Gaps to close
- Add a resolve/create endpoint call on chat mount to translate entrypoint label → `room_uuid` and persist it.
- Replace hard-coded `agent-lab` comparisons with checks against the resolved `room_uuid` to ensure AI enablement follows the actual room.
- Store and reuse `room_uuid` across routes so the chat bubble/page resumes the same conversation without relying on the label.
