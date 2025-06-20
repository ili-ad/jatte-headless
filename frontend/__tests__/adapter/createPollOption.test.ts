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

test('createPollOption posts option to API', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ poll_option: { id: 'opt1' } }),
  });

  const client = new ChatClient('u1', 'jwt-test');
  const res = await client.createPollOption('p1', { text: 'hi' });

  expect(global.fetch).toHaveBeenCalledWith(`${API.POLLS}p1/options/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
    body: JSON.stringify({ text: 'hi' }),
  });
  expect(res).toEqual({ poll_option: { id: 'opt1' } });
});
