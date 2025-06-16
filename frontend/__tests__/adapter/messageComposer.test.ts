import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API, EVENTS } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: 'm1', text: 'hello', user_id: 'u1', created_at: '2025-01-01T00:00:00Z' }),
  });
  (global as any).localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
});

afterEach(() => {
  global.fetch = originalFetch;
  delete (global as any).localStorage;
  vi.restoreAllMocks();
});

test('submit sends message and clears text', async () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');

  const eventSpy = vi.fn();
  channel.on(EVENTS.MESSAGE_NEW, eventSpy);

  channel.messageComposer.textComposer.setText('hello');
  await channel.messageComposer.submit();

  expect(global.fetch).toHaveBeenCalledWith(`${API.ROOMS}room1/messages/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt1',
    },
    body: JSON.stringify({ text: 'hello' }),
  });

  expect(channel.messageComposer.textComposer.state.getSnapshot().text).toBe('');
  expect(eventSpy).toHaveBeenCalled();
});
