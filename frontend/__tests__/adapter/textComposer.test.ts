import { expect, test } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

/** Ensure textComposer manages basic text state */
test('textComposer setText, setSelection, clear', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const comp: any = client.channel('messaging', 'room1').messageComposer.textComposer;

  expect(comp.state.getSnapshot().text).toBe('');
  comp.setText('hi');
  expect(comp.state.getSnapshot().text).toBe('hi');

  comp.setSelection({ start: 0, end: 2 });
  expect(comp.state.getSnapshot().selection).toEqual({ start: 0, end: 2 });

  comp.clear();
  expect(comp.state.getSnapshot().text).toBe('');
});
