import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ status: 'ok' }) }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('unmuteUser posts to backend endpoint', async () => {
  const client = new ChatClient('u1', 'jwt1');

  await client.unmuteUser('u2');

  expect(global.fetch).toHaveBeenCalledWith(`${API.UNMUTE_USER}u2/`, {
    method: 'POST',
    headers: { Authorization: 'Bearer jwt1' },
  });
});
