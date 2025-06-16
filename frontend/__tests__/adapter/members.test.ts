import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('fetchMembers fetches and stores channel members', async () => {
  const members = [
    { id: 1, username: 'u1' },
    { id: 2, username: 'u2' },
  ];
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => members });

  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  const res = await (channel as any).fetchMembers();

  expect(global.fetch).toHaveBeenCalledWith('/api/rooms/room1/members/', {
    headers: { Authorization: 'Bearer jwt1' },
  });
  expect(res).toEqual(members);
  expect(channel.members).toEqual(members);
});
