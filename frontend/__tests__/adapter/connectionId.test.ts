import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    .mockResolvedValue({ ok: true, json: async () => ({ connection_id: 'c123' }) });
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('connectUser sets connectionId', async () => {
  const client = new ChatClient('u1', 'jwt1');
  await client.connectUser({ id: 'u1' }, 'jwt1');
  expect(global.fetch).toHaveBeenCalledWith(API.CONNECTION_ID, expect.anything());
  expect(client.connectionId).toBe('c123');
});

test('disconnectUser clears connectionId', () => {
  const client = new ChatClient('u1', 'jwt1');
  client.connectionId = 'abc';
  client.disconnectUser();
  expect(client.connectionId).toBeNull();
});
