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

test('sendAction posts action to API', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true }),
  });

  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  await channel.sendAction('m1', { vote: 'yes' });

  expect(global.fetch).toHaveBeenCalledWith(`${API.MESSAGES}m1/actions/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
    body: JSON.stringify({ vote: 'yes' }),
  });
});
