import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

test('cid returns messaging:<uuid>', () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  expect(channel.cid).toBe('messaging:room1');
});
