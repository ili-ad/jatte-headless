# AI State Flow – Intended Design

## Backend → message metadata
- `AgentService.generate` persists an empty agent message with `custom_data.ai_state = "AI_STATE_THINKING"` when a run starts, then calls `mark_agent_state` to persist and broadcast the state change while setting `room.agent_busy = True`.【F:backend/chat_addons/agent/services/agent_service.py†L617-L635】
- Streaming switches the same message to `AI_STATE_GENERATING` before tokens are emitted, and every streamed chunk keeps that state on the message; the helper also logs each chunk.【F:backend/chat_addons/agent/services/agent_service.py†L949-L967】
- Completion, timeout, or cancellation rewrites `custom_data.ai_state` to `AI_STATE_IDLE` (or `AI_STATE_ERROR` on cancel/errors) and clears `room.agent_busy`; the final state is broadcast via `mark_agent_state` alongside any `error_reason` such as `timeout` or `cancelled`.【F:backend/chat_addons/agent/services/agent_service.py†L771-L812】【F:backend/chat_addons/agent/services/agent_service.py†L1043-L1068】【F:backend/chat_addons/agent/views.py†L391-L439】

## Transport
- `mark_agent_state` updates the message, saves it, and calls `broadcast_message_update(ai_message)` unless broadcasting is disabled. That is the only place AI state changes are emitted over websockets; the payload is a `message.updated` event carrying `custom_data.ai_state` on the message object.【F:backend/chat_addons/agent/services/agent_service.py†L63-L101】
- New agent messages are sent through `_broadcast_to_cid(..., {type: "message.new", message: payload})`, so both initial and updated AI messages reach the client as regular `message.new` / `message.updated` events with `custom_data.ai_state` populated.【F:backend/chat_addons/agent/services/agent_service.py†L625-L634】【F:backend/chat_addons/agent/services/agent_service.py†L1160-L1182】
- The websocket client in `LocalChatClient` forwards every incoming payload by `type` to both the channel and the client event buses; there is no special handling for AI indicators at this layer.【F:libs/chat-shim/index.ts†L633-L675】

## Shim expectations
- The Stream shim defines AI indicator events `'ai_indicator.update'` and `'ai_indicator.clear'` in its event map.【F:libs/stream-chat-shim/src/chatSDKShim.ts†L389-L418】
- `useAIState(channel)` listens **only** for those AI indicator events on the channel and updates local state when `event.ai_state` arrives. Clearing reverts to `AI_STATE_IDLE`.【F:libs/stream-chat-shim/src/components/AIStateIndicator/hooks/useAIState.ts†L18-L49】
- A helper in `chatAPI` can emit `'ai_indicator.clear'` locally when `stopAIResponse` aborts a request, but there is no corresponding emitter for `'ai_indicator.update'`.【F:libs/stream-chat-shim/src/api/chatAPI.ts†L5693-L5715】
- No shim code currently inspects `message.custom_data.ai_state` or converts message events into AI indicator events; AI state is expected to arrive directly as `ai_indicator` events from the backend.

## UI consumption
- `ChatUI` derives `isAgentBusy` from `useAIState(channel)` (`Thinking`/`Generating`) and uses it to block sending and show the stop button. The diagnostic effect confirms this hook is the source of truth for the lock state.【F:frontend/src/lib/ChatUI.tsx†L73-L85】【F:frontend/src/lib/ChatUI.tsx†L174-L194】
- `AIStateIndicator` uses the same hook, so it reflects whatever `useAIState` sees on the channel.
- `AgentAIStateBanner` separately listens to `message.new` / `message.updated` and reads `custom_data.ai_state` off agent-authored messages, defaulting to `thinking`/`generating`/`error` labels without involving `useAIState`. This is why the banner lights up even while `useAIState` stays idle.【F:frontend/src/app/agent/AgentAIStateBanner.tsx†L11-L76】

# Findings – Why aiState stays idle

1. **Backend sends state via message updates, not AI indicator events.** Every transition (`THINKING` → `GENERATING` → `IDLE` or `ERROR`) is written to `message.custom_data.ai_state` and broadcast as `message.updated`. There is no code in the backend that emits `ai_indicator.update` / `ai_indicator.clear` events expected by `useAIState`.【F:backend/chat_addons/agent/services/agent_service.py†L63-L101】【F:backend/chat_addons/agent/services/agent_service.py†L949-L1068】
2. **Shims never translate message AI state into indicator events.** `LocalChatClient` simply forwards incoming websocket payloads; nothing in `stream-chat-shim` watches `message.updated` for `custom_data.ai_state` or calls an internal `setAIStateForChannel`. The only AI-indicator emission present is a local `ai_indicator.clear` when the frontend aborts a run, so `ai_indicator.update` is never fired for real agent runs.【F:libs/chat-shim/index.ts†L633-L675】【F:libs/stream-chat-shim/src/api/chatAPI.ts†L5693-L5715】【F:libs/stream-chat-shim/src/components/AIStateIndicator/hooks/useAIState.ts†L18-L49】
3. **Hooks listen to the wrong signal.** Because `useAIState` subscribes solely to `ai_indicator.update/clear`, it never hears the backend’s message-based state changes and remains `AI_STATE_IDLE`. `AgentAIStateBanner` works because it reads `message.custom_data.ai_state` directly from `message.new/updated`, proving the data reaches the client but is not routed into the shim’s AI-state map.【F:frontend/src/app/agent/AgentAIStateBanner.tsx†L11-L76】【F:frontend/src/lib/ChatUI.tsx†L73-L85】

# Fix Options

## Option A: Emit AI indicator events when AI messages change
- **What:** Update the websocket emitter or `LocalChatClient` layer to translate incoming `message.new` / `message.updated` payloads with `custom_data.ai_state` into `channel.emit('ai_indicator.update', { cid, ai_state })` (plus `ai_indicator.clear` when state returns to idle/error). Keep message events untouched so existing banner logic still works.
- **Pros:** Aligns with the existing hook contract; `useAIState` and `AIStateIndicator` start working without UI changes. Minimal backend surface area if done in the client/shim.
- **Cons:** Requires careful mapping to avoid duplicate events and ensure the right channel `cid` is used; needs a policy for when to emit `clear` vs `update`.

## Option B: Teach `useAIState` to fall back to message metadata
- **What:** Extend `useAIState` (or the shim store it relies on) to inspect `channel.state.messages` for the latest agent message with `custom_data.ai_state`, updating local state whenever message events arrive.
- **Pros:** Leverages the existing message payloads; no backend change. Keeps a single source of truth (`message.custom_data.ai_state`).
- **Cons:** Slightly more frontend logic and may blur shim responsibilities if implemented inside `stream-chat-shim`; needs to handle streaming updates efficiently.

## Option C: Emit AI indicator updates from the backend
- **What:** Have the backend broadcast explicit `ai_indicator.update/clear` events alongside `message.updated` when `mark_agent_state` runs, matching the shim’s expected event types.
- **Pros:** Clean separation—UI keeps using the existing hook; no shim changes. Makes AI state transport explicit.
- **Cons:** Requires websocket layer changes and a new event type contract; must ensure compatibility with current consumers of `message.updated`.

**Recommendation:** Option A is the least invasive for the current stack: translate the already-available `custom_data.ai_state` on message events into `ai_indicator.update/clear` inside the shim/client. It keeps `message.custom_data` as the source of truth, aligns with `useAIState`’s expectations, and avoids backend protocol changes.
