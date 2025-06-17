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

test('recoverStateOnReconnect fetches state and updates stores', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({
      rooms: [
        { id: 1, uuid: 'r1', name: 'Room One' }
      ],
      notifications: [
        { id: 1, text: 'hi', created_at: '2025-01-01T00:00:00Z' }
      ]
    })
  });

  const client = new ChatClient('u1', 'jwt1');
  const result = await client.recoverStateOnReconnect();

  expect(global.fetch).toHaveBeenCalledWith(API.RECOVER_STATE, {
    headers: { Authorization: 'Bearer jwt1' },
  });
  expect(client.stateStore.getSnapshot().channels.length).toBe(1);
  expect(client.notifications.store.getSnapshot().notifications.length).toBe(1);
  expect(result.channels.length).toBe(1);
  expect(result.notifications.length).toBe(1);
});
