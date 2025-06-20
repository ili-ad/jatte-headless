import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: 'm2', text: 'hi', user_id: 'u1', created_at: '2025-01-01T00:00:00Z' }),
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('toggleShowReplyInChannel toggles state and affects sendMessage', async () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  expect(channel.messageComposer.showReplyInChannel).toBe(false);

  channel.messageComposer.toggleShowReplyInChannel();
  expect(channel.messageComposer.showReplyInChannel).toBe(true);

  await channel.sendMessage({ text: 'hi' });

  expect(global.fetch).toHaveBeenCalledWith(`${API.ROOMS}room1/messages/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
    body: JSON.stringify({ text: 'hi', show_in_channel: true }),
  });
});
