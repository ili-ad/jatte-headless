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

test('activeChannels stores channel after watch', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => [] });

  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');

  await channel.watch();

  expect(client.activeChannels[channel.cid]).toBe(channel);
});

test('disconnectUser clears activeChannels', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => [] });

  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  await channel.watch();

  client.disconnectUser();

  expect(Object.keys(client.activeChannels).length).toBe(0);
});
