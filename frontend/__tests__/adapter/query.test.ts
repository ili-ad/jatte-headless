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

test('query fetches messages and members without websocket', async () => {
  (global.fetch as any)
    .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'm1', text: 'hi', user_id: 'u2', created_at: '2025-01-01T00:00:00Z' }] })
    .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'u1' }, { id: 'u2' }] });

  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  await channel.query();

  expect(global.fetch).toHaveBeenCalledWith(`${API.ROOMS}room1/messages/`, {
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(global.fetch).toHaveBeenCalledWith(`${API.ROOMS}room1/members/`, {
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(channel.state.latestMessages.length).toBe(1);
  expect((global as any).WebSocket).not.toHaveBeenCalled();
  expect(client.activeChannels[channel.cid]).toBeUndefined();
  expect(channel.initialized).toBe(true);
});
