import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

/** Ensure hasSendableData reflects composer state */
test('hasSendableData returns true when text or other data present', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  const comp: any = channel.messageComposer;

  // initially empty
  expect(comp.hasSendableData).toBe(false);

  // text makes it true
  comp.textComposer.setText('hi');
  expect(comp.hasSendableData).toBe(true);
  comp.textComposer.clear();
  expect(comp.hasSendableData).toBe(false);

  // attachments make it true
  comp.attachmentManager.state._set({ attachments: [{ id: 'a1' }] });
  expect(comp.hasSendableData).toBe(true);
  comp.attachmentManager.state._set({ attachments: [] });
  expect(comp.hasSendableData).toBe(false);

  // custom data makes it true
  comp.customDataManager.set('foo', 1);
  expect(comp.hasSendableData).toBe(true);
  comp.customDataManager.clear();
  expect(comp.hasSendableData).toBe(false);

  // poll data makes it true
  comp.pollComposer.state._set({ poll: { question: 'q1' } });
  expect(comp.hasSendableData).toBe(true);
});
