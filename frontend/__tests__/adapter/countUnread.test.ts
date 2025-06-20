import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

// countUnread depends only on local state

test('countUnread returns 0 when no read data', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  expect(channel.countUnread()).toBe(0);
});

test('countUnread returns unread_messages for current user', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  // inject unread state
  channel.state.read['u1'] = {
    last_read: '2024-01-01T00:00:00Z',
    unread_messages: 3,
  };
  expect(channel.countUnread()).toBe(3);
});
