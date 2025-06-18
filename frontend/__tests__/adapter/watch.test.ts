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

test('watch fetches messages and opens websocket', async () => {
  const messages = [
    { id: 'm1', text: 'hi', user_id: 'u2', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  ];
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => messages });

  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');

  await channel.watch();

  expect(global.fetch).toHaveBeenCalledWith(`${API.ROOMS}room1/messages/`, {
    headers: { Authorization: 'Bearer jwt1' },
  });
  expect(channel.initialized).toBe(true);
  expect(channel.state.latestMessages).toEqual(messages);
  expect(channel.state.latestMessages[0].updated_at).toBe('2025-01-01T00:00:00Z');
  expect((global as any).WebSocket).toHaveBeenCalledWith(
    'ws://localhost:8000/ws/room1/?token=jwt1'
  );
});
