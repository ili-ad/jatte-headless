import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('disconnectUser clears state and notifies backend', () => {
  const client = new ChatClient('u1', 'jwt1');
  client.disconnectUser();

  expect(global.fetch).toHaveBeenCalledWith(API.SESSION, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer jwt1' },
  });

  expect((client as any).user).toBeUndefined();
  expect(client.jwt).toBeNull();
  expect(client.stateStore.getSnapshot().channels).toEqual([]);
});
