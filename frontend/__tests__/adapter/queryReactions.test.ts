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

test('queryReactions fetches reactions list', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => [{ id: 1 }] });

  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  const res = await channel.queryReactions('m1');

  expect(global.fetch).toHaveBeenCalledWith(`${API.MESSAGES}m1/reactions/`, {
    headers: { Authorization: 'Bearer jwt1' },
  });

  expect(res).toEqual([{ id: 1 }]);
});
