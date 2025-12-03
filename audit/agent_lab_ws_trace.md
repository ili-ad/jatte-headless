# Agent Lab WebSocket trace

## Overview
This note traces the Agent Lab message path from the user input through the frontend stream adapter, Django WebSocket consumer, and back into the React UI. It also records the shapes of the WebSocket payloads and highlights where propagation stops for the agent replies.

## 1) User sends a message → Channel.sendMessage
- The Agent Lab page uses `ChatUI` inside `ChatProvider`, which instantiates an adapter `Channel` and calls `watch()` for the `agent-lab` room.  
  – `ChatProvider` builds the channel and awaits `chan.watch()` during mount.【F:frontend/src/lib/ChatProvider.tsx†L31-L112】
- The `MessageInput` component (from the shim) delegates to `Channel.messageComposer.textComposer.submit()`. Submit creates a local optimistic payload with status `sending`, calls `integrateIncomingMessage` to show it immediately, and emits `message.new` for local listeners before hitting the network.【F:frontend/src/lib/stream-adapter/Channel.ts†L272-L321】
- `submit()` then calls `Channel.sendMessage`, which POSTs the message to `/rooms/<uuid>/messages/`, reconciles the optimistic entry via `integrateIncomingMessage`, and triggers the agent auto-reply hook when the room is `agent-lab`.【F:frontend/src/lib/stream-adapter/Channel.ts†L1170-L1207】
- After a successful send, `triggerAgentReplyIfEnabled` invokes `/api/chat/agent/<cid>/invoke/` with the last human message id. A `{status:"queued"}` response short-circuits because streaming updates are expected to arrive over WebSocket.【F:frontend/src/lib/stream-adapter/Channel.ts†L1211-L1280】

## 2) Backend agent job → streaming updates
- Agent replies are persisted with `_persist_message`, which broadcasts `{type:"message.new", message:{...}}` to the channel group via `_broadcast_to_cid`. The payload includes `user_id` and `user` metadata for the assistant user.【F:backend/chat_addons/agent/services/agent_service.py†L934-L964】
- Streaming updates reuse `_update_message`, which saves the partial text and calls `broadcast_message_update`. That function emits `{type:"message.updated", cid, message}` to the `chat.message` Channels group for every room containing the message.【F:backend/chat_addons/agent/services/agent_service.py†L969-L999】【F:backend/chat/consumers.py†L206-L238】
- The Channels consumer forwards any `chat.message` payload directly to the WebSocket client (`send_json(event["payload"])`). Its message-handling switch only subscribes a connection to a room when it receives a `channel.watch` frame, adding the socket to the `group_name_for_cid` group.【F:backend/chat/consumers.py†L52-L143】
- Payload examples seen in logs on the backend:
  - Initial stream insert: `{ "type": "message.new", "cid": "messaging:agent-lab", "message": {"id": <int>, "body": "", "user_id": "agent-…" } }`
  - Streaming chunk updates: `{ "type": "message.updated", "cid": "messaging:agent-lab", "message": {"id": <int>, "body": "partial text", "custom_data": {"ai_state": "AI_STATE_GENERATING"}} }`

## 3) Frontend WebSocket handling (Channel.watch)
- `Channel.watch` loads initial history via HTTP, opens `ws://${WS_BASE}/ws/${cid}/?token=…`, and attaches `onmessage` to parse events. Added logging now prints `[agent/ws] raw event` before the switch, so incoming shapes are visible in the console.【F:frontend/src/lib/stream-adapter/Channel.ts†L960-L1001】
- The switch accepts `message`, `message.new`, and `message.updated` types, normalizes the payload (`p.message ?? p.data ?? …`), and passes it to `integrateIncomingMessage` with status `received`. It also emits `EVENTS.MESSAGE_NEW` for listeners.【F:frontend/src/lib/stream-adapter/Channel.ts†L974-L1001】
- **Critical gap:** the client never sends a `channel.watch` frame after opening the socket. `Channel.watch` does not call `socket.send(...)`, so the Django consumer never executes `_handle_channel_watch`, meaning the connection is only in the lobby group and not subscribed to `messaging:agent-lab`. As a result, agent `message.new`/`message.updated` broadcasts never reach the browser, so the new `[agent/ws]` log line remains silent during agent runs.【F:frontend/src/lib/stream-adapter/Channel.ts†L960-L1001】【F:backend/chat/consumers.py†L52-L143】

## 4) State integration and React visibility
- When `integrateIncomingMessage` is called (optimistic sends or any future WS frames), it now logs `[agent/channel] integrateIncomingMessage …`, merges the payload into `messages`, dedupes/sorts, and bumps the `stateStore` so React subscribers re-render.【F:frontend/src/lib/stream-adapter/Channel.ts†L1630-L1665】
- `ChatUI` now subscribes to `channel.stateStore` and logs `[agent/ui] messages snapshot` whenever the message list changes, making it clear whether the React tree is receiving updates from the adapter.【F:frontend/src/lib/ChatUI.tsx†L19-L103】

## Findings
- WebSocket payloads emitted by Django match the shapes expected by the adapter (`type: message.new/message.updated` with a `message` object).【F:backend/chat_addons/agent/services/agent_service.py†L934-L999】【F:backend/chat/consumers.py†L206-L238】
- The adapter opens the WebSocket but never sends `{"type":"channel.watch","cid":<cid>}`. Without that subscription, the consumer keeps the socket out of the room-specific group, so no agent events are delivered to `Channel.watch` and nothing reaches `integrateIncomingMessage`/React.【F:frontend/src/lib/stream-adapter/Channel.ts†L960-L1001】【F:backend/chat/consumers.py†L52-L143】

### Proposed fix (not implemented here)
- After establishing the WebSocket in `Channel.watch`, send a `channel.watch` frame with the current `cid` and JWT. This will add the connection to `group_name_for_cid(...)`, allowing `message.new` and `message.updated` events (including streaming agent chunks) to flow into the existing switch and state store.
