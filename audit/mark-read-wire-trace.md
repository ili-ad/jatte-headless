# Mark read / unread wire audit

## Overview
This document summarizes the current read/unread and `mark_read` plumbing across the shim and backend: HTTP endpoints, local state handling, and websocket/event coverage.

## Frontend shim behavior
- `Channel.markRead()` issues a `POST` to `/rooms/${uuid}/mark_read/` with a bearer JWT and does not send a payload. On success or failure it also updates local state for the current user with `last_read: new Date()`, `last_read_message_id` taken from the latest message, and `unread_messages: 0`.【F:frontend/src/lib/stream-adapter/Channel.ts†L1143-L1165】
- `Channel.read()` performs a `GET` to `/rooms/${uuid}/read/` with a bearer JWT, expects a list of `{user, last_read, unread_messages}` strings/numbers, converts `last_read` to `Date`, and rebuilds `state.read` accordingly before returning the map.【F:frontend/src/lib/stream-adapter/Channel.ts†L855-L884】
- Local helpers derive unread counts and last-read timestamps from `state.read` (`countUnread`, `lastRead`).【F:frontend/src/lib/stream-adapter/Channel.ts†L842-L853】
- The shim’s websocket handler does not currently process any `message.read`/`notification.mark_read` events; unrecognized event types are logged only in non-production builds.【F:frontend/src/lib/stream-adapter/Channel.ts†L1125-L1139】

## Backend / REST endpoints
- `/api/rooms/<room_uuid>/mark_read/` exists and accepts `POST`; it upserts a `ReadState` row for the authenticated user with `last_read=timezone.now()` and returns `{"status": "ok"}`.【F:backend/chat/urls.py†L102-L123】【F:backend/chat/api_views.py†L557-L570】
- `/api/rooms/<room_uuid>/mark_unread/` exists and accepts `POST`; it deletes the user’s `ReadState` for the room and returns `{"status": "ok"}`.【F:backend/chat/urls.py†L102-L123】【F:backend/chat/api_views.py†L573-L583】
- `/api/rooms/<room_uuid>/read/` exists and accepts `GET`; it returns all read states for the room as `{user, last_read, unread_messages}` with `unread_messages` computed from messages newer than `last_read`.【F:backend/chat/urls.py†L102-L123】【F:backend/chat/api_views.py†L614-L634】
- Additional read-related endpoints include `/api/rooms/<room_uuid>/count_unread/` (per-user unread count) and `/api/rooms/<room_uuid>/last_read/` (per-user timestamp).【F:backend/chat/urls.py†L102-L123】【F:backend/chat/api_views.py†L585-L612】
- Read state model: `backend/chat/models.py` defines `ReadState` with `channel`, `user` (string), and `last_read` timestamp, unique per `(user, channel)`.【F:backend/chat/models.py†L110-L120】

### Per-room read helpers

- `GET /api/rooms/<room_uuid>/count_unread/`
  - Purpose: return the unread message count for the current user in this room.
  - Current usage: Defined but unused (no frontend or shim callers found).
  - Notes: Frontend derives unread counts from `/read/` + `state.read` and never hits this endpoint today; keep available for future per-room unread shortcuts.【F:backend/chat/api_views.py†L582-L612】

- `GET /api/rooms/<room_uuid>/last_read/`
  - Purpose: return the last read timestamp for the current user in this room.
  - Current usage: Defined but unused (no frontend or shim callers found).
  - Notes: Shim rebuilds `last_read` from `/read/` response and local state; this endpoint remains present for potential lightweight polling.【F:backend/chat/api_views.py†L599-L612】

## Websocket/read events
- No Django consumer code currently emits `message.read` or `notification.mark_read` events; only message/typing/AI indicator events are handled in the shim’s websocket switch. The Stream shim type map includes `notification.mark_read`/`notification.mark_unread` event types, but there is no backend producer observed in this repo.【F:frontend/src/lib/stream-adapter/Channel.ts†L1125-L1139】【F:libs/stream-chat-shim/src/chatSDKShim.ts†L389-L413】

## Gaps & observations
- The frontend shim calls `/rooms/${uuid}/mark_read/` and updates local state, but no websocket read events are produced to synchronize other clients.
- Backend `mark_read` exists under `/api/rooms/<uuid>/mark_read/`; 404s in logs likely stem from mismatched paths or missing trailing slashes in callers.
- No websocket broadcast of read/unread changes is present, so read state is only refreshed via REST calls and local optimistic updates.
- `ReadState.user` stores a string username while the shim treats user IDs generically; ensure identifiers align when wiring cross-system updates.
