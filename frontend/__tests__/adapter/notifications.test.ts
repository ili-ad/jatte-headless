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

test('notifications store populated via getNotifications', async () => {
  const notes = [
    { id: 1, text: 'hello', created_at: '2025-01-01T00:00:00Z' },
  ];
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => notes,
  });

  const client = new ChatClient('u1', 'jwt-test');
  const res = await client.getNotifications();

  expect(global.fetch).toHaveBeenCalledWith(API.NOTIFICATIONS, {
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(res).toEqual(notes);
  expect(client.notifications.store.getSnapshot().notifications).toEqual(notes);
});
