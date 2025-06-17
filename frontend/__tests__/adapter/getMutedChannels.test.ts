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

test('getMutedChannels fetches muted rooms and updates client list', async () => {
  const rooms = [{ id: 1, uuid: 'r1', name: 'Room 1' }];
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => rooms });

  const client = new ChatClient('u1', 'jwt1');
  const channels = await client.getMutedChannels();

  expect(global.fetch).toHaveBeenCalledWith(API.MUTED_CHANNELS, {
    headers: { Authorization: 'Bearer jwt1' },
  });
  expect(channels).toHaveLength(1);
  expect(client.mutedChannels).toHaveLength(1);
  expect(channels[0].cid).toBe('messaging:r1');
});
