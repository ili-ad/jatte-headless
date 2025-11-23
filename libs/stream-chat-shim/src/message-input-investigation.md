# Message input context and submission flow

## Components and context wiring
- `MessageInput` wraps its children in `MessageInputContextProvider`, seeding values from `useMessageInputControls` and `useCreateMessageInputContext` so downstream UI (e.g., `MessageInputFlat`) can access `handleSubmit`, `recordingController`, and composition settings. 【F:libs/stream-chat-shim/src/components/MessageInput/MessageInput.tsx†L34-L98】
- `MessageInputFlat` renders the actual UI and pulls `handleSubmit`, cooldown state, and other controls from `useMessageInputContext`. The send icon (`SendButton`) receives `handleSubmit` as its `sendMessage` prop. 【F:libs/stream-chat-shim/src/components/MessageInput/MessageInputFlat.tsx†L21-L97】【F:libs/stream-chat-shim/src/components/MessageInput/SendButton.tsx†L9-L22】
- `useMessageInputContext` exposes `handleSubmit` and related props supplied by `MessageInputProvider`. 【F:libs/stream-chat-shim/src/context/MessageInputContext.tsx†L5-L29】

## Active channel injection
- Chat-level state is built in `Chat` using `useCreateChatContext`, which memoizes the active `channel` along with `setActiveChannel` and client data before passing them to `ChatProvider`. `setActiveChannel` from `useChat` updates this active channel and triggers optional channel queries. 【F:libs/stream-chat-shim/src/components/Chat/Chat.tsx†L90-L118】【F:libs/stream-chat-shim/src/components/Chat/hooks/useCreateChatContext.ts†L7-L53】【F:libs/stream-chat-shim/src/components/Chat/hooks/useChat.ts†L123-L176】
- Inside `Channel`, `useCreateChannelStateContext` injects the active `channel` (and capabilities/config) into `ChannelStateProvider`, making it available via `useChannelStateContext`. `useMessageComposer` consumes `useChatContext` and `useChannelStateContext` so the composer is bound to the current channel (or thread/edit contexts). 【F:libs/stream-chat-shim/src/components/Channel/Channel.tsx†L123-L151】【F:libs/stream-chat-shim/src/components/Channel/hooks/useCreateChannelStateContext.ts†L8-L94】【F:libs/stream-chat-shim/src/components/MessageInput/hooks/useMessageComposer.ts†L13-L88】

## Enter key vs. send-icon submission
- `TextareaComposer` calls `handleSubmit` from context when `shouldSubmit` returns true (default: Enter without Shift or IME composition). This path does not pass the keyboard event into `handleSubmit`. 【F:libs/stream-chat-shim/src/components/TextareaComposer/TextareaComposer.tsx†L1-L67】【F:libs/stream-chat-shim/src/components/TextareaComposer/TextareaComposer.tsx†L220-L268】
- `handleSubmit` itself prevents default behavior if it receives an event and then composes the message (edit vs. new send flow). 【F:libs/stream-chat-shim/src/components/MessageInput/hooks/useSubmitHandler.ts†L33-L95】
- The `SendButton` uses the same `handleSubmit` function but passes the click event through, so both Enter presses and the send icon run the identical submission pipeline; the only difference is whether an event object is provided. 【F:libs/stream-chat-shim/src/components/MessageInput/SendButton.tsx†L9-L22】【F:libs/stream-chat-shim/src/components/MessageInput/hooks/useSubmitHandler.ts†L33-L95】

## Stream UI package
- The `libs/stream-ui` directory is currently empty, so no `MessageInput` implementations or contexts exist there to inspect. 【F:libs/stream-ui†L1-L2】
