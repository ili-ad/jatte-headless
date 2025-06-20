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

test('getConfig fetches room config', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ typing_events: true }),
  });

  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  const cfg = await channel.getConfig();
  expect(global.fetch).toHaveBeenCalledWith(
    `${API.ROOMS}room1/config/`,
    { headers: { Authorization: `Bearer jwt-test` } }
  );
  expect(cfg).toEqual({ typing_events: true });
});
