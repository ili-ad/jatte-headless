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

test('customDataManager set and clear modify state', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  const mgr = channel.messageComposer.customDataManager as any;
  mgr.set('foo', 1);
  expect(mgr.state.getSnapshot().customData.foo).toBe(1);
  mgr.clear();
  expect(mgr.state.getSnapshot().customData).toEqual({});
});

test('sendMessage includes custom_data payload', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ id: 'm1', text: 'hello', user_id: 'u1', created_at: '2025-01-01T00:00:00Z', custom_data: { foo: 1 } }),
  });
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  channel.messageComposer.customDataManager.set('foo', 1);

  await channel.sendMessage({ text: 'hello' });

  expect(global.fetch).toHaveBeenCalledWith(`${API.ROOMS}room1/messages/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
    body: JSON.stringify({ text: 'hello', custom_data: { foo: 1 } }),
  });
  expect(channel.messageComposer.customDataManager.state.getSnapshot().customData).toEqual({});
});
