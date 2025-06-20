import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('deleteReaction sends DELETE to API', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true });

  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  await channel.deleteReaction('m1', 'r1');

  expect(global.fetch).toHaveBeenCalledWith(`${API.MESSAGES}m1/reactions/r1/`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer jwt-test' },
  });
});

