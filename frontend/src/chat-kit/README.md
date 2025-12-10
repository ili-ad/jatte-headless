# `chat-kit`: Public chat surface

`chat-kit` is the public entrypoint for the Jatte chat UI and client. It wraps
our internal `stream-adapter` layer plus vendored Stream libraries to present a
stable API. App routes and host projects should import from **`chat-kit` only**;
`lib/stream-adapter` and `libs/*` remain implementation details that may change
without notice.

## Public exports: UI

- **`ChatWindow`** – Plain chat window with message list, typing indicator, and
  composer. Intended for standard chat rooms without agent chrome.
- **`AgentChatWindow`** – Agent-aware variant that shows AI indicators, stop
  controls, and agent message rendering for rooms with an agent in the loop.
- **`ChatProvider`** – React provider that wires Supabase session, `ChatClient`
  + `Channel`, the room slug (channel ID), and config-state polling for the
  active chat.
- **`useChat`** – Hook exposing the current chat context (client, channel,
  room info) to nested components.

Example usage inside an app route:

```ts
import { ChatProvider, ChatWindow } from '@jatte-headless/chat-kit';

export default function ContactChat() {
  return (
    <ChatProvider roomSlug="contact-support">
      <ChatWindow />
    </ChatProvider>
  );
}
```

## Public exports: client

- **`ChatClient`** – Main client for talking to the backend (HTTP + websocket).
- **`Channel`** – Stream-like channel used by the UI and any custom chat logic.
- **Types** – Any types re-exported by `chat-kit` (e.g. message or room shapes)
  are available for advanced consumers.

Low-level usage is available but most apps should stick to `ChatProvider` +
`ChatWindow`:

```ts
import { ChatClient, Channel } from '@jatte-headless/chat-kit';

const client = new ChatClient({ baseUrl: '/api/chat' });
const channel = new Channel(client, { cid: 'messaging:general' });

// Advanced usage only; prefer the higher-level provider + window components.
```

## Architecture layers

```
libs/* (vendored Stream ecosystem)
↓
frontend/src/lib/stream-adapter (ChatClient, Channel, MiniStore)
↓
frontend/src/chat-kit (public UI + client API)
↓
frontend/src/app/* (routes & demo UIs)
```

- Do **not** import directly from `libs/*` or `lib/stream-adapter` in app code.
- Use the `chat-kit` entrypoint as the single source for chat UI and client APIs.

## Import guidelines

- ✅ **Do this (app / host projects):**

  ```ts
  import { ChatProvider, ChatWindow } from '@jatte-headless/chat-kit';
  // or, inside this repo:
  import { ChatProvider, ChatWindow } from '../chat-kit';
  ```

- 🚫 **Don’t do this in app code:**

  ```ts
  // Internal only:
  import { Channel } from '../lib/stream-adapter';
  import { Chat } from 'libs/stream-chat-shim';
  ```

In host projects, treat `chat-kit` as the only public API. The internal layout
under `lib/` and `libs/` may change without notice.
