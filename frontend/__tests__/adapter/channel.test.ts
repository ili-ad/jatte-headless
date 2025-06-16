import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

// channel() should return a Channel instance with correct cid/id

test('channel returns Channel with matching cid and default id', () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  expect(channel.cid).toBe('messaging:room1');
  expect(channel.id).toBe(0);
  expect(channel.data).toEqual({ name: 'room1' });
  // ensure channel holds reference to client
  // @ts-ignore internal
  expect(channel['client']).toBe(client);
});
