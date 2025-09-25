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

test('muteUser posts to backend endpoint', async () => {
  const client = new ChatClient('u1', 'jwt-test');
  await client.muteUser('42', { cid: 'messaging:general' });
  expect(global.fetch).toHaveBeenCalledWith(
    `/api${API.ROOMS}${encodeURIComponent('messaging:general')}/mutes/`,
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer jwt-test',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ user_id: 42 }),
    }),
  );
});
