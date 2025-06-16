import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

test('setUserAgent updates returned user agent', () => {
  const client = new ChatClient('u1', 'jwt1');
  client.setUserAgent('my-agent/1.0');
  expect(client.getUserAgent()).toBe('my-agent/1.0');
});
