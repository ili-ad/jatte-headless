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

test('getConfigState fetches config and updates store', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ text: { enabled: false } }),
  });
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  const cfg = await (channel.messageComposer as any).getConfigState();
  expect(global.fetch).toHaveBeenCalledWith('/api/rooms/room1/config-state/', {
    headers: { Authorization: 'Bearer jwt1' },
  });
  expect(cfg.text.enabled).toBe(false);
  expect(channel.messageComposer.configState.getSnapshot().text.enabled).toBe(false);
});
