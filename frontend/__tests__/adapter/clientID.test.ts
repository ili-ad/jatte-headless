import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('clientID generated on connectUser includes user id', async () => {
  const client = new ChatClient();
  await client.connectUser({ id: 'u1' }, 'jwt1');
  expect(client.clientID).toMatch(/^u1--/);
  expect(global.fetch).toHaveBeenCalledWith(API.SYNC_USER, expect.anything());
});
