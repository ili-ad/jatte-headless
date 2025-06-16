import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('markUnread posts to backend and clears read state', async () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  (channel.state as any).read['u1'] = {
    last_read: '2025-01-01T00:00:00Z',
    unread_messages: 0,
  };

  await channel.markUnread();

  expect(global.fetch).toHaveBeenCalledWith('/api/rooms/room1/mark_unread/', {
    method: 'POST',
    headers: { Authorization: 'Bearer jwt1' },
  });
  expect(channel.state.read['u1']).toBeUndefined();
});
