import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('userID reflects constructor value', () => {
  const client = new ChatClient('u1', 'jwt1');
  expect(client.userID).toBe('u1');
});

test('userID updates on connectUser and clears on disconnectUser', async () => {
  const client = new ChatClient(null, null);
  await client.connectUser({ id: 'u2' }, 'jwt2');
  expect(client.userID).toBe('u2');

  client.disconnectUser();
  expect(client.userID).toBeNull();
});
