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

test('pinnedMessages fetches list and updates state', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => [{ id: 'p1' }] });
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  const list = await channel.pinnedMessages();

  expect(global.fetch).toHaveBeenCalledWith(`/api/rooms/room1/pinned`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
  });
  expect(list).toEqual([{ id: 'p1' }]);
  expect(channel.state.pinnedMessages).toEqual([{ id: 'p1' }]);
});
