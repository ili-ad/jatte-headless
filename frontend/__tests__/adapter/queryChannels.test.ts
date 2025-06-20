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

test('queryChannels fetches rooms and updates state', async () => {
  const rooms = [
    { id: 1, uuid: 'room1', name: 'Room One' },
    { id: 2, uuid: 'room2', name: undefined },
  ];

  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => rooms,
  });

  const client = new ChatClient('u1', 'jwt-test');
  const channels = await client.queryChannels();

  expect(global.fetch).toHaveBeenCalledWith(API.ROOMS, {
    headers: { Authorization: 'Bearer jwt-test' },
  });

  expect(channels).toHaveLength(2);
  expect(channels[0].cid).toBe('messaging:room1');
  expect(channels[0].id).toBe(1);
  expect(client.stateStore.getSnapshot().channels.length).toBe(2);
});
