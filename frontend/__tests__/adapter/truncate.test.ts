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

test('truncate posts to backend endpoint', async () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');

  await channel.truncate();

  expect(global.fetch).toHaveBeenCalledWith('/api/rooms/room1/truncate/', {
    method: 'POST',
    headers: { Authorization: 'Bearer jwt1' },
  });
});

