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

test('getPolls fetches list and updates store', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => [{ id: 'p1' }] });
  const client = new ChatClient('u1', 'jwt1');
  const res = await client.getPolls();

  expect(global.fetch).toHaveBeenCalledWith(API.POLLS, {
    headers: { Authorization: 'Bearer jwt1' },
  });
  expect(res).toEqual([{ id: 'p1' }]);
  expect(client.polls.store.getSnapshot().polls).toEqual([{ id: 'p1' }]);
});
