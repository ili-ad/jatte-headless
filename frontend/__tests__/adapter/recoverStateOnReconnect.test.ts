import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

// ensure default value is true and can be toggled

test('recoverStateOnReconnect defaults to true and can be set', () => {
  const client = new ChatClient('u1', 'jwt1');
  expect(client.recoverStateOnReconnect).toBe(true);

  client.recoverStateOnReconnect = false;
  expect(client.recoverStateOnReconnect).toBe(false);
});
