# Agent lab reply trace

## Room selection & channel setup
- `/agent` renders `ChatInner` with `roomSlug="agent-lab"`, so ChatProvider opens the `agent-lab` channel instead of `general`.
- ChatProvider connects the user and calls `channel.watch()` for the requested slug; it also fetches `/rooms/<slug>/config-state/` through the channel’s composer helper to populate AI flags.

## Frontend send path
1. The message composer builds an optimistic message and calls `Channel.sendMessage` with `{ text, client_generated_id }`.
2. After the POST to `/rooms/<uuid>/messages/` succeeds, `Channel.sendMessage` integrates the server echo and calls `triggerAgentReplyIfEnabled`.
3. `triggerAgentReplyIfEnabled` looks for AI config in `messageComposer.configState` or `agentConfig` and checks `hasAssistant`, defined as `has_ai_assistant` if that key is present **even when it is `false`**, otherwise `aiConfig.enabled`.
4. Because the config-state payload does **not** include `has_ai_assistant`, the default `false` in the composer store wins, so `hasAssistant` is `false` and the agent invocation is skipped. No `/chat/agent/.../invoke/` request is sent from the frontend today.

## Backend agent endpoints
- `POST /chat/agent/<cid>/invoke/` expects `{ prompt: string, meta?: object }`; it generates a run id, enqueues `run_agent_invocation`, and returns `{ run_id, status: "queued" }` (202).
- `POST /chat/agent/rag/` expects `{ room_uuid, last_human_message_id, client_generated_id?, trace_id? }`; it validates the message/room, calls `AgentService.generate` synchronously, and returns `{ messages: [...], reason }`.

## Agent service & persistence
- `AgentService.generate` orchestrates skills, then persists the reply when `persist=True`. `_persist_reply` creates a `Message` in the room under the agent user id, serializes it, and calls `_broadcast_to_cid` with a `message.new` payload so websocket subscribers receive it.
- The Celery task `run_agent_invocation` wraps the same service: it calls `service.generate`, then `_persist_message` (same shape as `_persist_reply`) and records provenance. The `shared_task` shim executes synchronously when Celery isn’t installed, so the invocation path should still persist and broadcast.

## Expected delivery back to the UI
- `_broadcast_to_cid` sends the `message.new` event on the Channels group for the room; the frontend websocket listens for `message.new` and feeds messages into `Channel.integrateIncomingMessage`, which merges by id/client_generated_id and appends to the ordered list.
- Therefore, if the agent message were created, it would render as a separate bubble (different `user_id`).

## Breakpoint summary
The chain stops on the frontend: `triggerAgentReplyIfEnabled` short-circuits because `has_ai_assistant` defaults to `false` and the room config response never overrides it. As a result, `/agent` never POSTs to the agent endpoint, so no backend agent logic runs.

## Fix options to restore replies
1. **Frontend flag handling**: Treat `has_ai_assistant` as `undefined` unless the backend explicitly sets it, or fall back to `aiConfig.enabled` when it is `false` by default. That allows `agent-lab`’s `ai.enabled: true` config to trigger `invokeAgent`.
2. **Backend config-state enrichment**: Add `has_ai_assistant: true` (or similar) to `/rooms/<uuid>/config-state/` when `agent_enabled_for_room` returns true, aligning with the frontend’s flag expectation.
3. Optionally, wire the agent reply request to the synchronous `/chat/agent/rag/` endpoint if you want immediate HTTP-delivered messages; otherwise keep the async `invoke` path but ensure the flag allows it to fire.
