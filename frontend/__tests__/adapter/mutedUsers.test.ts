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

test('getMutedUsers fetches muted users', async () => {
  const users = [{ id: 2, username: 'u2' }];
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => users });

  const client = new ChatClient('u1', 'jwt-test');
  const res = await client.getMutedUsers();

  expect(global.fetch).toHaveBeenCalledWith(API.MUTED_USERS, {
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(res).toEqual(users);
  expect(client.mutedUsers).toEqual(users);
});
