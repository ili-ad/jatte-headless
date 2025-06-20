import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

/** Ensure compositionIsEmpty reflects text composer state */
test('compositionIsEmpty mirrors text composer', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  // initially empty
  expect(channel.messageComposer.compositionIsEmpty).toBe(true);

  // after setting text it becomes false
  channel.messageComposer.textComposer.setText('hello');
  expect(channel.messageComposer.compositionIsEmpty).toBe(false);

  // clearing returns to true
  channel.messageComposer.textComposer.clear();
  expect(channel.messageComposer.compositionIsEmpty).toBe(true);
});
