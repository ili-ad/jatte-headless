import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('userToken reflects constructor value', () => {
  const client = new ChatClient('u1', 'jwt-test');
  expect(client.userToken).toBe('jwt-test');
});

test('userToken updates on connectUser and clears on disconnectUser', async () => {
  const client = new ChatClient(null, null);
  await client.connectUser({ id: 'u2' }, 'jwt2');
  expect(client.userToken).toBe('jwt2');

  client.disconnectUser();
  expect(client.userToken).toBeNull();
});
