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

test('getUser fetches current user and updates property', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ id: 1, username: 'u1' }) });
  const client = new ChatClient('u1', 'jwt-test');
  const info = await client.getUser();
  expect(global.fetch).toHaveBeenCalledWith(API.USER, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
  });
  expect(info.username).toBe('u1');
  expect(client.user.id).toBe('1');
});
