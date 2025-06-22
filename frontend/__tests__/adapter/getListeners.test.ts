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
  const client = new ChatClient('u1', 'jwt-test');
  const res = await client.getListeners();
  expect(global.fetch).toHaveBeenCalledWith(API.LISTENERS, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
  });
  expect(res).toEqual(['message.new']);
});
