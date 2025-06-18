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

test('getDraft fetches saved draft and updates text', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ text: 'hello' }),
  });
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');

  const text = await (channel.messageComposer as any).getDraft();

  expect(global.fetch).toHaveBeenCalledWith('/api/rooms/room1/draft/', {
    headers: { Authorization: 'Bearer jwt1' },
  });
  expect(text).toBe('hello');
  expect(channel.messageComposer.textComposer.state.getSnapshot().text).toBe('hello');
});
