import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';


const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('markRead posts to backend and updates state', async () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  // populate messages so lastId exists
  (channel.state as any).latestMessages = [
    { id: 'm1', text: 'hi', user_id: 'u2', created_at: '2025-01-01T00:00:00Z' }
  ];

  await channel.markRead();

  expect(global.fetch).toHaveBeenCalledWith(
    `${API.ROOMS}room1/mark_read/`,
    { method: 'POST', headers: { Authorization: 'Bearer jwt-test' } },
  );
  const read = channel.state.read['u1'];
  expect(read.unread_messages).toBe(0);
  expect(read.last_read_message_id).toBe('m1');
});
