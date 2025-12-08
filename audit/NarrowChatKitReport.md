# Narrow Chat Kit Client Surface – Usage Audit

Findings from searching for `@/lib/stream-adapter` imports (alias-based):

## App / library code outside the adapter
- `frontend/src/lib/getStreamClient.ts` - imports `ChatClient` (runtime) to create the singleton client.
- `frontend/src/lib/chat-addons/agentApi.ts` - imports `Channel` (type-only) for agent helper context.
- `frontend/src/app/agent/AgentAIStateBanner.tsx` - imports `Channel` (type-only) directly from `@/lib/stream-adapter/Channel`.

## Core kit neighbor (left as-is for now)
- `frontend/src/lib/ChatProvider.tsx` - imports `ChatClient` (type), `Channel` (type), and `Channel` class (runtime) from the adapter barrel. This module sits alongside the adapter and should keep the direct dependency to avoid circular references.

No other `@/lib/stream-adapter` imports were found outside the adapter implementation itself.
