import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

// getClient should return the ChatClient instance itself

test('getClient returns the client instance', () => {
  const client = new ChatClient('u1', 'jwt1');
  expect(client.getClient()).toBe(client);
});
