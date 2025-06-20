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

test('setUserAgent updates returned user agent and posts to backend', () => {
  const client = new ChatClient('u1', 'jwt-test');
  client.setUserAgent('my-agent/1.0');

  expect(global.fetch).toHaveBeenCalledWith(API.USER_AGENT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-test' },
    body: JSON.stringify({ user_agent: 'my-agent/1.0' }),
  });
  expect(client.getUserAgent()).toBe('my-agent/1.0');
});
