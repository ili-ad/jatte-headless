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

test('muteStatus fetches mute state', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ muted: true }) });
  const client = new ChatClient('u1', 'jwt-test');
  const result = await client.muteStatus('u2');
  expect(global.fetch).toHaveBeenCalledWith(`${API.MUTE_STATUS}u2/`, { headers: { Authorization: 'Bearer jwt-test' } });
  expect(result).toBe(true);
});
