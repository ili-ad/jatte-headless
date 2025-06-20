import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;
const originalWS = (global as any).WebSocket;

beforeEach(() => {
  global.fetch = vi.fn();
  (global as any).WebSocket = vi.fn(() => ({ onmessage: null }));
});

afterEach(() => {
  global.fetch = originalFetch;
  (global as any).WebSocket = originalWS;
  vi.restoreAllMocks();
});

test('members are fetched on watch', async () => {
  (global.fetch as any)
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
    .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'u1' }, { id: 'u2' }] });

  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  await channel.watch();

  expect(global.fetch).toHaveBeenNthCalledWith(1, `${API.ROOMS}room1/messages/`, {
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(global.fetch).toHaveBeenNthCalledWith(2, `${API.ROOMS}room1/members/`, {
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(channel.members).toEqual({
    u1: { user: { id: 'u1' } },
    u2: { user: { id: 'u2' } },
  });
});
