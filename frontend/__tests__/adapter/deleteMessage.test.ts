import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({
        id: 'm1',
        text: 'hello',
        user_id: 'u1',
        created_at: '2025-01-01T00:00:00Z',
        deleted_at: '2025-01-01T01:00:00Z',
      }),
    })
  );
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('deleteMessage calls backend and updates state', async () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  (channel.state as any).messages = [
    { id: 'm1', text: 'hello', user_id: 'u1', created_at: '2025-01-01T00:00:00Z' },
  ];
  (channel.state as any).latestMessages = [...(channel.state as any).messages];

  const result = await channel.deleteMessage('m1');

  expect(global.fetch).toHaveBeenCalledWith(`${API.MESSAGES}m1/`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(channel.state.messages[0].deleted_at).toBe('2025-01-01T01:00:00Z');
  expect(result.deleted_at).toBe('2025-01-01T01:00:00Z');
});
