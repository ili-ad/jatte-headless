import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ client_id: 'x123' }) })
    .mockResolvedValue({ ok: true, json: async () => ({}) });
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('clientID generated on connectUser includes user id', async () => {
  const client = new ChatClient();
  await client.connectUser({ id: 'u1' }, 'jwt-test');

  // clientID should now start with the user id and a separator
  expect(client.clientID).toMatch(/^u1--/);

  expect(global.fetch).toHaveBeenCalledWith(`/api${API.CLIENT_ID}`, expect.anything());
  expect(global.fetch).toHaveBeenCalledWith(`/api${API.SYNC_USER}`, expect.anything());
  expect(client.clientID).toBe('u1--x123');
});
