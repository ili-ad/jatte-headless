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

test('channel id reflects server id', async () => {
  const rooms = [{ id: 1, uuid: 'r1', name: 'Room 1' }];
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => rooms });

  const client = new ChatClient('u1', 'jwt-test');
  const [channel] = await client.queryChannels();

  expect(global.fetch).toHaveBeenCalledWith(API.ROOMS, {
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(channel.id).toBe(1);
});
