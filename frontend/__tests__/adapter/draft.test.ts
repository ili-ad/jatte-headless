import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

/** Ensure draft getter/setter mirror text composer */
test('draft property mirrors text composer', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  // default empty
  expect(channel.messageComposer.draft).toBe('');

  channel.messageComposer.textComposer.setText('hello');
  expect(channel.messageComposer.draft).toBe('hello');

  channel.messageComposer.draft = 'bye';
  expect(channel.messageComposer.textComposer.state.getSnapshot().text).toBe('bye');
});
