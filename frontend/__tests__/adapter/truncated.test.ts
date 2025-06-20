import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('truncate sets truncated flag', async () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  await channel.truncate();

  expect(channel.truncated).toBe(true);
});
