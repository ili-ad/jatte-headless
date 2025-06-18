import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({ id: 'm1', text: 'edited', user_id: 'u1', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:01:00Z' }),
    })
  );
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('updateMessage PUTs to backend and updates state', async () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  (channel.state as any).messages = [
    { id: 'm1', text: 'old', user_id: 'u1', created_at: '2025-01-01T00:00:00Z' },
  ];
  (channel.state as any).latestMessages = [...(channel.state as any).messages];

  const result = await channel.updateMessage('m1', 'edited');

  expect(global.fetch).toHaveBeenCalledWith(`${API.MESSAGES}m1/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt1',
    },
    body: JSON.stringify({ text: 'edited' }),
  });

  expect(channel.state.messages[0].text).toBe('edited');
  expect(channel.state.messages[0].updated_at).toBe('2025-01-01T00:01:00Z');
  expect(result.text).toBe('edited');
  expect(result.updated_at).toBe('2025-01-01T00:01:00Z');
});
