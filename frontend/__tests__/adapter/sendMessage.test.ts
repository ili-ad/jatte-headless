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

test('sendMessage posts message, updates state, and emits event', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ id: 'm1', text: 'hello', user_id: 'u1', created_at: '2025-06-15T00:00:00Z' }),
  });

  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');

  const eventSpy = vi.fn();
  client.on('message.new', eventSpy);

  await channel.sendMessage({ text: 'hello' });

  expect(global.fetch).toHaveBeenCalledWith('/api/rooms/room1/messages/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt1',
    },
    body: JSON.stringify({ text: 'hello' }),
  });

  expect(eventSpy).toHaveBeenCalledTimes(1);
  expect(eventSpy.mock.calls[0][0].message.text).toBe('hello');
});
