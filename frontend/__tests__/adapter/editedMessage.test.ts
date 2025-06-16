import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

const sampleMessage = {
  id: 'm1',
  text: 'hello',
  user_id: 'u2',
  created_at: '2025-01-01T00:00:00Z',
};

test('setEditedMessage updates composer state', () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');

  channel.messageComposer.setEditedMessage(sampleMessage as any);
  expect(channel.messageComposer.editedMessage).toEqual(sampleMessage);
  expect(channel.messageComposer.textComposer.state.getSnapshot().text).toBe('hello');

  channel.messageComposer.setEditedMessage(undefined);
  expect(channel.messageComposer.editedMessage).toBeUndefined();
  expect(channel.messageComposer.textComposer.state.getSnapshot().text).toBe('');
});
