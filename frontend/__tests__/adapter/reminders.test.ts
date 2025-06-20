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

test('getReminders fetches list and updates store', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => [{ id: 1, text: 'rem', remind_at: '2025-01-01T00:00:00Z' }],
  });
  const client = new ChatClient('u1', 'jwt-test');
  const res = await client.getReminders();
  expect(global.fetch).toHaveBeenCalledWith(API.REMINDERS, {
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(res).toEqual([{ id: 1, text: 'rem', remind_at: '2025-01-01T00:00:00Z' }]);
  expect(client.reminders.store.getSnapshot().reminders.length).toBe(1);
});
