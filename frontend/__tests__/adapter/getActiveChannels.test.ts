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

test('getActiveChannels fetches active rooms', async () => {
  const rooms = [{ uuid: 'r1', name: 'Room 1' }];
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => rooms });

  const client = new ChatClient('u1', 'jwt-test');
  const channels = await client.getActiveChannels();

  expect(global.fetch).toHaveBeenCalledWith(API.ACTIVE_ROOMS, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
  });
  expect(channels).toHaveLength(1);
  expect(channels[0].cid).toBe('messaging:r1');
});
