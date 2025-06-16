import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

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
    { uuid: 'room1', name: 'Room One' },
    { uuid: 'room2', name: undefined },
  ];

  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => rooms,
  });

  const client = new ChatClient('u1', 'jwt1');
  const channels = await client.queryChannels();

  expect(global.fetch).toHaveBeenCalledWith('/api/rooms/', {
    headers: { Authorization: 'Bearer jwt1' },
  });

  expect(channels).toHaveLength(2);
  expect(channels[0].cid).toBe('messaging:room1');
  expect(client.stateStore.getSnapshot().channels.length).toBe(2);
});
