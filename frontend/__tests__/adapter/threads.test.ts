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

test('getThreads fetches list and updates store', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => [{ id: 't1' }] });
  const client = new ChatClient('u1', 'jwt1');
  const res = await client.getThreads();

  expect(global.fetch).toHaveBeenCalledWith(API.THREADS, {
    headers: { Authorization: 'Bearer jwt1' },
  });
  expect(res).toEqual([{ id: 't1' }]);
  expect(client.threads.state.getSnapshot().threads).toEqual([{ id: 't1' }]);
});
