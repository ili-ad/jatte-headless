import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

// lastRead depends only on local state

test('lastRead returns undefined when no read data', () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  expect(channel.lastRead()).toBeUndefined();
});

test('lastRead returns Date for current user', () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  channel.state.read['u1'] = {
    last_read: '2024-01-01T00:00:00Z',
    unread_messages: 0,
  };
  const val = channel.lastRead();
  expect(val).toBeInstanceOf(Date);
  expect(val?.toISOString()).toBe('2024-01-01T00:00:00.000Z');
});
