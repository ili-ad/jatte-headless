import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('getReplies fetches replies for message', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => [{ id: 'r1' }] });

  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  const replies = await channel.getReplies('m1');

  expect(global.fetch).toHaveBeenCalledWith(`${API.MESSAGES}m1/replies/`, {
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(replies).toEqual([{ id: 'r1' }]);
});
