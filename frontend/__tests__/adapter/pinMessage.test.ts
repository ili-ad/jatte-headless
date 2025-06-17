import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ pin: { id: 1 } }) }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('pinMessage posts to API', async () => {
  const client = new ChatClient('u1', 'jwt1');
  await client.pinMessage('m1');
  expect(global.fetch).toHaveBeenCalledWith(`${API.MESSAGES}m1/pin/`, {
    method: 'POST',
    headers: { Authorization: 'Bearer jwt1' },
  });
});
