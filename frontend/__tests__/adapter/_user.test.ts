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

test('_user populated on connectUser and cleared on disconnectUser', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ id: 1, username: 'u1' }) });
  const client = new ChatClient(null, null);
  await client.connectUser({ id: 'u1' }, 'jwt1');
  expect(global.fetch).toHaveBeenCalledWith(API.SYNC_USER, expect.anything());
  expect((client as any)._user.username).toBe('u1');

  client.disconnectUser();
  expect((client as any)._user).toBeNull();
});

test('_user updated by getUser', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ id: 2, username: 'u2' }) });
  const client = new ChatClient('u2', 'jwt2');
  const info = await client.getUser();
  expect((client as any)._user.username).toBe('u2');
  expect(info.username).toBe('u2');
});
