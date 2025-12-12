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
    json: async () => ({
      config: {
        composer: { text: { enabled: false } },
        ai: { enabled: true, botUserId: 'room:room1:bot', displayName: 'TestBot', personaSummary: null },
      },
    }),
  });
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  const cfg = await (channel.messageComposer as any).getConfigState();
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/rooms/room1/config-state/',
    expect.objectContaining({ headers: { Authorization: 'Bearer jwt-test' } }),
  );
  expect(cfg.composer.text.enabled).toBe(false);
  expect(cfg.ai.enabled).toBe(true);
  expect(channel.messageComposer.configState.getSnapshot().composer.text.enabled).toBe(false);
});
