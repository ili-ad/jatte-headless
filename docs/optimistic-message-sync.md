# Optimistic message flow parity with Stream

References pulled while aligning the adapter with upstream behaviour:

- **stream-chat** (JS client) `src/messageComposer/messageComposer.ts` – `compose` builds a local message with a client-generated `id`, marks it as `status: 'sending'`, and reuses the same id for the outgoing payload.
- **stream-chat-react** `src/components/Channel/Channel.tsx` – `doSendMessage` replaces an optimistic message in channel state when the server response arrives, preferring messages in `status === 'sending'` and merging by the client-generated id.

Key takeaways we mirror here:

- Generate a client-side message id once per submission and apply it to both the optimistic placeholder and the payload sent to the backend.
- Mark optimistic entries as `status: 'sending'` so later updates can replace them instead of appending duplicates.
- When a server response or `message.new` event arrives, merge it into existing channel state by that client id and drop the placeholder, keeping `latestMessages` and `messages` in sync.
