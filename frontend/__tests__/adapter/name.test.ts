import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

test('name getter reflects data.name', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  // default name from constructor
  expect(channel.name).toBe('room1');
  channel.data.name = 'New Name';
  expect(channel.name).toBe('New Name');
});
