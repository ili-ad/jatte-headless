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

test('queryUsers fetches users list', async () => {
  const users = [
    { id: 1, username: 'u1' },
    { id: 2, username: 'u2' },
  ];

  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => users,
  });

  const client = new ChatClient('u1', 'jwt1');
  const res = await client.queryUsers();

  expect(global.fetch).toHaveBeenCalledWith(API.USERS, {
    headers: { Authorization: 'Bearer jwt1' },
  });

  expect(res).toEqual(users);
});
