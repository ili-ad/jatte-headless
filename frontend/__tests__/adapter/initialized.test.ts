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

test('initialized flag toggles on connect and disconnect', async () => {
  const client = new ChatClient(null, null);
  expect(client.initialized).toBe(false);

  await client.connectUser({ id: 'u1' }, 'jwt-test');
  expect(client.initialized).toBe(true);

  client.disconnectUser();
  expect(client.initialized).toBe(false);
});
