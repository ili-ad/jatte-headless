import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

/** Ensure initState resets composer and sets edited message */
test('initState resets stores', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  channel.messageComposer.textComposer.setText('hello');
  channel.messageComposer.setEditedMessage({
    id: 'm0',
    text: 'draft',
    user_id: 'u1',
    created_at: new Date().toISOString(),
  } as any);

  channel.messageComposer.initState();
  expect(channel.messageComposer.textComposer.state.getSnapshot().text).toBe('');
  expect(channel.messageComposer.editedMessage).toBeUndefined();

  const msg = { id: 'm1', text: 'bye', user_id: 'u1', created_at: new Date().toISOString() } as any;
  channel.messageComposer.initState({ composition: msg });
  expect(channel.messageComposer.editedMessage).toEqual(msg);
  expect(channel.messageComposer.textComposer.state.getSnapshot().text).toBe('bye');
});
