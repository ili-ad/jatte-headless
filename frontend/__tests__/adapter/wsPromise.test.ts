import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('wsPromise is set and awaited during connectUser', async () => {
  const client = new ChatClient('u1', 'jwt1');
  await client.connectUser({ id: 'u1' }, 'jwt1');

  expect(client.wsPromise).toBeInstanceOf(Promise);
  expect(global.fetch).toHaveBeenCalledWith(API.SYNC_USER, {
    method: 'POST',
    headers: { Authorization: 'Bearer jwt1' },
  });
  expect(global.fetch).toHaveBeenCalledWith(API.WS_AUTH, {
    headers: { Authorization: 'Bearer jwt1' },
  });
});
