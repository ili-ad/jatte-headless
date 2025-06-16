import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

const sampleMessage = {
  id: 'm1',
  text: 'hello',
  user_id: 'u2',
  created_at: '2025-01-01T00:00:00Z',
};

test('setQuotedMessage updates composer state', () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');

  channel.messageComposer.setQuotedMessage(sampleMessage as any);
  expect(channel.messageComposer.state.getSnapshot().quotedMessage).toEqual(sampleMessage);

  channel.messageComposer.setQuotedMessage(undefined);
  expect(channel.messageComposer.state.getSnapshot().quotedMessage).toBeUndefined();
});
