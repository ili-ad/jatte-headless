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

test('hide posts to backend and sets hidden', async () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  await channel.hide();

  expect(global.fetch).toHaveBeenCalledWith('/api/rooms/room1/hide/', {
    method: 'POST',
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(channel.hidden).toBe(true);
});

test('show posts to backend and clears hidden', async () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  channel.data.hidden = true;

  await channel.show();

  expect(global.fetch).toHaveBeenCalledWith('/api/rooms/room1/show/', {
    method: 'POST',
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(channel.hidden).toBe(false);
});
