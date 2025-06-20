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

test('client.state stores users from queryUsers', async () => {
  const users = [
    { id: 1, username: 'u1' },
    { id: 2, username: 'u2' },
  ];
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => users });

  const client = new ChatClient('u1', 'jwt-test');
  await client.queryUsers();

  expect(global.fetch).toHaveBeenCalledWith(API.USERS, {
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(client.state.users['1'].username).toBe('u1');
  expect(client.state.users['2'].username).toBe('u2');
});

test('client.state stores user from getUser', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ id: 3, username: 'me' }) });
  const client = new ChatClient('u1', 'jwt-test');
  await client.getUser();
  expect(global.fetch).toHaveBeenCalledWith(API.USER, { headers: { Authorization: 'Bearer jwt-test' } });
  expect(client.state.users['3'].username).toBe('me');
});
