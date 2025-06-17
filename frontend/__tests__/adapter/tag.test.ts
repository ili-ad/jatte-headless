import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

test('messageComposer has tag "root"', () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  expect(channel.messageComposer.tag).toBe('root');
});
