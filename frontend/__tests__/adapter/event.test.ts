import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API, EVENTS } from '../../src/lib/stream-adapter/constants';

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

test('watch preserves event field on messages', async () => {
  const messages = [
    {
      id: 'm1',
      text: 'hi',
      user_id: 'u2',
      created_at: '2025-01-01T00:00:00Z',
      event: { type: 'member.added', user: { id: 'u2' } },
    },
  ];
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => messages });

  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  await channel.watch();
  expect(channel.messages[0].event?.type).toBe('member.added');
});

test('sendMessage stores event field from response', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({
      id: 'm1',
      text: 'hi',
      user_id: 'u1',
      created_at: '2025-06-15T00:00:00Z',
      event: { type: 'member.added', user: { id: 'u1' } },
    }),
  });

  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  await channel.sendMessage({ text: 'hi' });

  expect(channel.messages[0].event?.type).toBe('member.added');
});
