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

test('sendReaction posts reaction to API', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ id: 1, type: 'like', user_id: 'u1', created_at: '2025-01-01T00:00:00Z' }),
  });

  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  await channel.sendReaction('m1', 'like');

  expect(global.fetch).toHaveBeenCalledWith(`${API.MESSAGES}m1/reactions/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
    body: JSON.stringify({ type: 'like' }),
  });
});

