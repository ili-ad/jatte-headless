import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

/** Ensure compose builds a message when text is present */
test('compose returns local message payload', async () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  // empty text -> undefined
  let result = await channel.messageComposer.compose();
  expect(result).toBeUndefined();

  // after setting text -> returns composition object
  channel.messageComposer.textComposer.setText('hello');
  result = await channel.messageComposer.compose();
  expect(result).toBeDefined();
  expect(result!.message.text).toBe('hello');
  expect(result!.localMessage.id).toMatch(/^local-/);
});
