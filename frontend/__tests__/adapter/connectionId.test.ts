import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('connectUser sets connectionId', async () => {
  const client = new ChatClient('u1', 'jwt1');
  await client.connectUser({ id: 'u1' }, 'jwt1');
  expect(client.connectionId).not.toBeNull();
});

test('disconnectUser clears connectionId', () => {
  const client = new ChatClient('u1', 'jwt1');
  client.connectionId = 'abc';
  client.disconnectUser();
  expect(client.connectionId).toBeNull();
});
