# Chat send pipeline

This note traces how a message typed in the `/chat` UI is delivered to the Django API (`POST /api/rooms/<cid>/messages/`). It calls out which pieces are upstream Stream UI kit, which are our shim/adapter, and which live in Django.

## Frontend flow (Next.js → adapter)
1. **Page entry** – `/frontend/src/app/chat/page.tsx` defers rendering to the client-only `ChatInner` component so the heavy chat UI is not server-rendered.
2. **Context wiring** – `ChatInner` wraps `ChatUI` with `ChatProvider`, which:
   - Instantiates a **ChatClient** (our adapter) via `getStreamClient`.
   - Obtains chat credentials, connects the user, and creates a single `Channel` instance for the `general` room.
   - Exposes `{ client, channel }` via React context for the UI layer.
3. **Stream UI kit host** – `ChatUI` renders Stream’s React components (`Chat`, `Channel`, `Window`, `MessageList`, `MessageInput`) from `@iliad/stream-chat-shim`. These components expect Stream-like objects but are backed by our adapter instead of the real SDK.
4. **Custom Channel + composer** – The `Channel` adapter in `frontend/src/lib/stream-adapter/Channel.ts` exposes a `messageComposer` object that satisfies what the Stream `MessageInput` looks for. The composer:
   - Maintains text state, draft persistence, and ancillary managers (attachments, link previews, polls, custom data).
   - Implements `textComposer.submit()` to optimistically echo the message locally, then call `channel.sendMessage({ text })`.
   - Provides `compose()` / `sendMessage()` hooks that `MessageInput` uses when you click send or press Enter.
5. **Network send** – `Channel.sendMessage` builds the POST payload and calls `apiFetch` against `${API.ROOMS}${roomUuid}/messages/`.
   - Payload includes `body` (text), optional `custom_data`, `poll`, `reply_to`, and `show_in_channel` derived from composer state.
   - On success it pushes the returned message into the channel store and emits the Stream-style `message.new` event the UI listens for.

### Vendor vs shim on the frontend
- **Vendor (Stream UI kit / SDK):** The React components imported from `@iliad/stream-chat-shim` (`Chat`, `Channel`, `Window`, `MessageList`, `MessageInput`). They expect Stream-like props but are treated as external.
- **Our shim/adapter:**
  - `frontend/src/lib/stream-adapter/*` (ChatClient, Channel, composer helpers) implements the minimal Stream client surface the UI kit calls.
  - `frontend/src/lib/ChatProvider.tsx` and `getStreamClient.ts` bridge app auth/session into the adapter.
- **App glue:** `frontend/src/app/chat/*` simply wires the provider and UI.

## Backend handling (Django)
1. **Endpoint:** `RoomMessageListCreateView` (`backend/chat/api_views.py`) serves `POST /api/rooms/<cid>/messages/`.
   - Resolves the room from the CID, enforces access, and throttles POSTs.
2. **Serializer:** `MessageSerializer` (`backend/chat/serializers.py`) maps the incoming payload:
   - `text` is a write-only alias for the `body` model field, so either `text` or `body` can supply the message text.
   - `custom_data`, `show_in_channel`, `reply_to` (as an ID), `attachments`, and `preview` are accepted and normalized before model creation.
3. **Model creation & broadcast:** `perform_create` sets `sent_by`, associates the message with the room/channel, clears drafts, and (if not gated) broadcasts a `message.new` event to WebSocket listeners.

### Message shape
- **What the frontend sends:** `{ body: <string>, custom_data?: object, poll?: object, reply_to?: string, show_in_channel?: boolean }` (attachments and other composer-managed fields may be added as those features are enabled).
- **What the serializer expects:**
  - `text` (alias for `body`) carries the message text; `body` itself is read-only in responses.
  - Optional `custom_data`, `show_in_channel`, `attachments[]`, `preview`, and `reply_to` (parent ID) are accepted and persisted.
  - Response includes `text` (body), `id`, timestamps, `hidden` flags, `parent_id`, `pinned` metadata, and any stored attachments/custom data.

## Responsibility boundaries
- **Upstream Stream UI kit (vendor):** Visual components and UX behaviors. Changes there should not require backend edits if our adapter still satisfies their interface.
- **Shim/adapter layer (ours):** `frontend/src/lib/stream-adapter/*` plus the chat provider glue. It translates UI kit expectations into the Django REST contract (e.g., `messageComposer` → `POST /api/rooms/<cid>/messages/`). Future Stream upgrades should mostly be absorbed here.
- **Django backend:** `RoomMessageListCreateView` and `MessageSerializer` own validation, model mapping, gating, and broadcast. They treat `body` as the canonical text field and manage room/thread bookkeeping.

## Smoke-testing tips
- Send a message in `/chat` and watch the Network tab for `POST /api/rooms/<cid>/messages/` with a JSON body containing `body`.
- If the UI shows an optimistic echo but nothing persists, check `Channel.sendMessage` in the adapter and the Django view/serializer for errors.
- For thread replies, ensure `reply_to` is present in the payload and that the serializer resolves the parent ID.
