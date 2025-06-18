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
        text: 'edited',
        user_id: 'u1',
        created_at: '2025-01-01T00:00:00Z',
      }),
    })
  );
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('editedMessage fetches message and updates state', async () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  (channel.state as any).messages = [
    { id: 'm1', text: 'old', user_id: 'u1', created_at: '2025-01-01T00:00:00Z' },
  ];
  (channel.state as any).latestMessages = [...(channel.state as any).messages];

  const msg = await (channel as any).editedMessage('m1');

  expect(global.fetch).toHaveBeenCalledWith(`${API.MESSAGES}m1/`, {
    headers: { Authorization: 'Bearer jwt1' },
  });
  expect(channel.state.messages[0].text).toBe('edited');
  expect(msg.id).toBe('m1');
});
