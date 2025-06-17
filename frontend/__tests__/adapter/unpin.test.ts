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

test('unpin posts DELETE to API', async () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');

  await channel.unpin('m1');

  expect(global.fetch).toHaveBeenCalledWith(`${API.MESSAGES}m1/unpin/`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer jwt1' },
  });
});
