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

test('read fetches states and updates channel', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => [
      { user: 'u1', last_read: '2025-01-01T00:00:00Z', unread_messages: 0 },
      { user: 'u2', last_read: '2025-01-02T00:00:00Z', unread_messages: 1 },
    ],
  });
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  const map = await channel.read();

  expect(global.fetch).toHaveBeenCalledWith(`/api/rooms/room1/read/`, {
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(map.u2.unread_messages).toBe(1);
  expect(channel.state.read.u1.last_read).toBe('2025-01-01T00:00:00Z');
});
