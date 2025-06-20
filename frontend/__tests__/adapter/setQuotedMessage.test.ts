import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

let originalFetch: any;

beforeEach(() => {
  originalFetch = global.fetch;
  global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

const sampleMessage = {
  id: 'm1',
  text: 'hello',
  user_id: 'u2',
  created_at: '2025-01-01T00:00:00Z',
};

test('setQuotedMessage updates composer state and posts message', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  channel.messageComposer.setQuotedMessage(sampleMessage as any);
  expect(channel.messageComposer.state.getSnapshot().quotedMessage).toEqual(sampleMessage);
  expect(global.fetch).toHaveBeenCalledWith(API.QUOTED_MESSAGE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
    body: JSON.stringify({ quoted_message: sampleMessage }),
  });

  channel.messageComposer.setQuotedMessage(undefined);
  expect(channel.messageComposer.state.getSnapshot().quotedMessage).toBeUndefined();
  expect(global.fetch).toHaveBeenLastCalledWith(API.QUOTED_MESSAGE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
    body: JSON.stringify({ quoted_message: null }),
  });
});
