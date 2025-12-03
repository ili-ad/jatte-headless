# Agent Lab message rendering notes

## Message flow (stream-ui → shim → Agent Lab)
- `frontend/src/lib/ChatUI.tsx` mounts `Chat` → `Channel` → `Window` → `MessageList` from `@iliad/stream-chat-shim`; the Chat provider supplies the client/channel established in `ChatProvider`.【F:frontend/src/lib/ChatUI.tsx†L3-L120】【F:frontend/src/lib/ChatProvider.tsx†L31-L149】
- `Channel` wires contexts (state/action/component/typing) and exposes channel state from the Stream adapter; component overrides (including `Message`) are passed via props into `ComponentContext` for children like `MessageList`.【F:libs/stream-chat-shim/src/components/Channel/Channel.tsx†L1290-L1341】【F:libs/stream-chat-shim/src/components/Channel/Channel.tsx†L1460-L1500】
- Channel state is populated with normalized messages in `chatSDKShim.toNormalizedChannelMessage`, which maps backend fields into `LocalMessage` shape (`id`, `cid`, `created_at`, `text`, `user`, `user_id`, optional `deleted_at`, etc.).【F:libs/stream-chat-shim/src/chatSDKShim.ts†L182-L244】
- `MessageList` reads messages from `ChannelStateContext`, enriches them (grouping, separators), and turns them into React elements via `useMessageListElements`, `renderMessages`, and `Message`.【F:libs/stream-chat-shim/src/components/MessageList/MessageList.tsx†L45-L184】【F:libs/stream-chat-shim/src/components/MessageList/renderMessages.tsx†L1-L143】
- `Message` delegates the final bubble UI to a `Message` UI component chosen from `props.Message` → component context overrides → default `MessageSimple`.【F:libs/stream-chat-shim/src/components/Message/Message.tsx†L64-L176】【F:libs/stream-chat-shim/src/components/Message/Message.tsx†L187-L191】

## Existing customization hooks
- **Chat-level**: `<Chat>` accepts `isMessageAIGenerated`, but does not alter rendering; it feeds context consumed by `Message`/`AIStateIndicator`.【F:libs/stream-chat-shim/src/components/Chat/Chat.tsx†L34-L97】
- **Channel-level**: `<Channel>` props include a `Message` component override (among many others) that is injected into `ComponentContext`. Downstream components (including `MessageList`/`Message`) read that override automatically. No upstream change is required to pass a custom message component here.【F:libs/stream-chat-shim/src/components/Channel/Channel.tsx†L1290-L1341】【F:libs/stream-chat-shim/src/components/Channel/Channel.tsx†L1460-L1500】
- **MessageList-level**: `MessageListProps` surface both `Message` (forwarded to individual `Message` instances) and `renderMessages` (a callback replacing the default list rendering). Both are passed through `useMessageListElements` into `renderMessages`, which wraps each item with `<Message ... />` by default.【F:libs/stream-chat-shim/src/components/MessageList/MessageList.tsx†L145-L184】【F:libs/stream-chat-shim/src/components/MessageList/MessageList.tsx†L287-L360】【F:libs/stream-chat-shim/src/components/MessageList/renderMessages.tsx†L48-L143】
- **Message-level**: `Message` picks `propMessage ?? contextMessage ?? DefaultMessage`, so supplying `Message` at either the `MessageList` prop level or via `Channel` component overrides will swap the bubble implementation. Message props include the full `LocalMessage` object with `user`, `user_id`, and any custom fields merged into channel state, enabling a RAG-aware component to read `custom_data` or flags like `ai_generated`.【F:libs/stream-chat-shim/src/components/Message/Message.tsx†L64-L177】【F:libs/stream-chat-shim/src/chatSDKShim.ts†L182-L244】

## Candidate extension points for a RAG-aware bubble
- **Option 1: Override `Message` on `MessageList` / `Channel`.**
  - Pass `<MessageList Message={AgentMessage} />` inside `Window`, or set `<Channel Message={AgentMessage}>` to push the override through `ComponentContext` for all lists.
  - Pros: Minimal surface area; leverages existing message lifecycle (read state, reactions, typing indicators). No need to fork list logic; upstream updates to list behavior still apply.
  - Cons: Agent bubble must respect existing `MessageProps` contract; customizing list layout (e.g., interleaving summaries) would still rely on default renderMessages grouping.

- **Option 2: Custom `AgentMessageList` in frontend using shim hooks.**
  - Build a wrapper in `frontend/` that calls `useChannelStateContext` (inside `Channel`) to read `messages`, reuse `useMessageListElements` with a custom `renderMessages`, or map `messages` directly into a bespoke list.
  - Pros: Full control over layout (insert RAG summaries, clustered bubbles, etc.) without touching vendor code.
  - Cons: Must mirror pagination/scroll logic from `MessageList` (unread indicators, typing indicator placement), so more maintenance burden when upstream changes.

## Recommended path
Prefer **Option 1**: supply a custom `AgentMessage` component via `Channel` or directly on `MessageList`. This keeps pagination, grouping, unread separators, and typing indicators intact while letting the new component render RAG metadata (e.g., `message.custom_data.rag`) using the existing `LocalMessage` shape populated by `chatSDKShim`.
