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

test('sendMessage posts message to API', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true });
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');

  await channel.sendMessage({ text: 'hello' });

  expect(global.fetch).toHaveBeenCalledWith('/api/rooms/room1/messages/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt1',
    },
    body: JSON.stringify({ text: 'hello' }),
  });
});
