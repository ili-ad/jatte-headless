import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: [2,3] }) });
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('subarray posts to backend and returns slice', async () => {
  const client = new ChatClient('u1', 'jwt-test');
  const result = await client.subarray([1,2,3,4], 1, 3);

  expect(global.fetch).toHaveBeenCalledWith(API.SUBARRAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-test' },
    body: JSON.stringify({ array: [1,2,3,4], start: 1, end: 3 }),
  });
  expect(result).toEqual([2,3]);
});
