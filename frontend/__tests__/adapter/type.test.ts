import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

test('channel.type is messaging', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  expect(channel.type).toBe('messaging');
});
