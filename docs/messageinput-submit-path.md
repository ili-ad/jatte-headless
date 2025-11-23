# MessageInput submit runtime path

1. **UI triggers** – `<MessageInput>` wires `handleSubmit` from `useSubmitHandler`, which composes the message and then calls the channel composer’s `textComposer.submit()` when it exists so the UI’s submit button and Enter key both follow the same route.
2. **Composer hand-off** – `textComposer.submit()` in the adapter immediately performs the optimistic echo, clears the draft, and fires `Channel.sendMessage` with the composed text.
3. **Network send** – `Channel.sendMessage` posts to `POST /rooms/{uuid}/messages/`, appends the persisted message to state, emits `EVENTS.MESSAGE_NEW`, and clears composer metadata.

This path keeps the UI-provided submit handler and the adapter’s network send in sync, ensuring `MessageInput` delegates all submit flows through the channel shim before hitting the backend.
