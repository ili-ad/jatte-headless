import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

test('getUserAgent returns custom identifier', () => {
  const client = new ChatClient('u1', 'jwt1');
  expect(client.getUserAgent()).toBe('custom-chat-client/0.0.1 stream-chat-react-adapter');
});
