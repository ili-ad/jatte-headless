import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ target_user_id: 2, muted: false }),
    }),
  );
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('unmuteUser posts to backend endpoint', async () => {
  const client = new ChatClient('u1', 'jwt-test');
  await client.unmuteUser(2);
  expect(global.fetch).toHaveBeenCalledWith(
    `/api${API.UNMUTE_USER}`,
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer jwt-test',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ target_user_id: 2 }),
    }),
  );
});
