import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ status: 'flagged' }) }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('flagMessage posts to API', async () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  await channel.flagMessage('m1');

  expect(global.fetch).toHaveBeenCalledWith(`${API.MESSAGES}m1/flag/`, {
    method: 'POST',
    headers: { Authorization: 'Bearer jwt-test' },
  });
});
