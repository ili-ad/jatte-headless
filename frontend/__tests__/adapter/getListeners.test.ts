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

test('getListeners fetches available listeners', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ listeners: ['message.new'] }) });
  const client = new ChatClient('u1', 'jwt1');
  const res = await client.getListeners();
  expect(global.fetch).toHaveBeenCalledWith(API.LISTENERS, {
    headers: { Authorization: 'Bearer jwt1' },
  });
  expect(res).toEqual(['message.new']);
});
