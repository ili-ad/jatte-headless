# Agent Lab WS → UI flow (instrumentation note)

## Frontend mount points
- `ChatProvider` connects the shim client, sets the Supabase JWT on the adapter, creates the `agent-lab` channel, and calls `watch()` during mount so the room is ready before `ChatUI` renders.【F:frontend/src/lib/ChatProvider.tsx†L16-L115】
- `ChatUI` renders the shim components inside the provider. Its debug hook now logs both the full message list and any messages that look like they come from the agent (user `ai-bot-agent-lab` or `ai_generated` flag).【F:frontend/src/lib/ChatUI.tsx†L17-L76】

## Adapter (Channel) behavior
- `Channel.watch()` fetches initial history with `GET /rooms/<uuid>/messages/` and members, then opens `ws://${WS_BASE}/ws/${cid}/?token=…`. The new logging prints socket open/error/close events plus the full WS URL for easier reproduction.【F:frontend/src/lib/stream-adapter/Channel.ts†L915-L999】
- Incoming WS payloads are parsed and logged with their event type. For `message/message.new/message.updated`, the adapter logs message id/user/client_generated_id/ai_generated and routes them to `integrateIncomingMessage`, emitting `EVENTS.MESSAGE_NEW`. Typing events and unknown event types also emit structured debug entries.【F:frontend/src/lib/stream-adapter/Channel.ts†L1001-L1075】
- `integrateIncomingMessage` now logs the cid/uuid/message id, author, and `ai_generated` hint before normalizing/bumping the state store. Any agent message that lands here will be visible even if rendering fails.【F:frontend/src/lib/stream-adapter/Channel.ts†L1654-L1680】

## Agent auto-reply path
- `Channel.sendMessage` persists the user’s message, reconciles optimistic state, and then calls `triggerAgentReplyIfEnabled` for the `agent-lab` room.【F:frontend/src/lib/stream-adapter/Channel.ts†L1166-L1207】
- `triggerAgentReplyIfEnabled` guards against echoing bot messages and calls `invokeAgent` with the room UUID, last human message id, and the client-generated id. Queued responses short-circuit; otherwise, returned messages are normalized and fed through `integrateIncomingMessage`.【F:frontend/src/lib/stream-adapter/Channel.ts†L1211-L1279】
- `invokeAgent` logs the payload sent to `/api/chat/agent/<cid>/invoke/`, the HTTP status, raw response text, parsed JSON, and whether the response was queued versus synchronous messages. This gives visibility into the HTTP leg before WS events should appear.【F:frontend/src/lib/chat-addons/agentApi.ts†L55-L113】

## Backend expectations
- Agent execution logs under `agent.llm.streaming.*` stream chunks, then the service persists a final agent message and broadcasts `message.new`/`message.updated` events via the Django Channels consumer (`chat_message` handler).【F:backend/chat_addons/agent/services/agent_service.py†L934-L999】【F:backend/chat/consumers.py†L51-L143】【F:backend/chat/consumers.py†L206-L238】

## Current observable gap
- In the browser trace we only see `user.join` presence events delivered over WS; no `message.new` events for the agent reply make it to the adapter/UI yet, despite the backend job completing. The added logs should show exactly where that propagation stops the next time the agent runs.【F:audit/agent_lab_ws_trace.md†L1-L50】

## AI state indicator wiring
- `AIStateIndicator` uses the `useAIState` hook, which subscribes to `ai_indicator.update` (sets `aiState` to the `ai_state` payload) and `ai_indicator.clear` (resets to `AI_STATE_IDLE`) events emitted by the channel. Only `AI_STATE_THINKING` and `AI_STATE_GENERATING` render text, but the hook tracks `AI_STATE_ERROR`, `AI_STATE_IDLE`, and `AI_STATE_EXTERNAL_SOURCES` as well via the exported `AIStates` map.【F:libs/stream-chat-shim/src/components/AIStateIndicator/AIStateIndicator.tsx†L8-L27】【F:libs/stream-chat-shim/src/components/AIStateIndicator/hooks/useAIState.ts†L1-L43】
- The shim-side client now provides `setAIState`/`clearAIState` helpers that dispatch `ai_indicator.update`/`ai_indicator.clear` through the channel’s event emitter, so the hook can pick up state changes from our adapter without new server events.【F:frontend/src/lib/stream-adapter/ChatClient.ts†L222-L258】
