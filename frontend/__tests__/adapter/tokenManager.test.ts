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

test('tokenManager stores and refreshes token', async () => {
  (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
  const client = new ChatClient();
  await client.connectUser({ id: 'u1' }, 't1');
  expect(client.tokenManager.getToken()).toBe('t1');

  (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ token: 't2' }) });
  await client.refreshToken();

  expect(global.fetch).toHaveBeenLastCalledWith(API.REFRESH_TOKEN, { headers: { Authorization: 'Bearer t1' } });
  expect(client.userToken).toBe('t2');
  expect(client.tokenManager.getToken()).toBe('t2');
});

test('disconnectUser resets tokenManager', () => {
  const client = new ChatClient('u1', 't1');
  client.disconnectUser();
  expect(client.tokenManager.token).toBeUndefined();
});
