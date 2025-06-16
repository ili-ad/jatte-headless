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

test('cooldown fetches cooldown value', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ cooldown: 5 }),
  });

  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');

  const cd = await channel.cooldown();
  expect(global.fetch).toHaveBeenCalledWith(
    `${API.COOLDOWN}room1/cooldown/`,
    { headers: { Authorization: `Bearer jwt1` } }
  );
  expect(cd).toBe(5);
});
