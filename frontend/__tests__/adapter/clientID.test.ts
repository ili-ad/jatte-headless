import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

test('clientID is fixed identifier', () => {
  const client = new ChatClient('u1', 'jwt1');
  expect(client.clientID).toBe('local-dev');
});
