import { expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

/** ensure registerSubscriptions wires store listeners */
test('registerSubscriptions subscribes and unsubscribes', () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  const composer: any = channel.messageComposer;
  const spy = vi.spyOn(composer, 'logStateUpdateTimestamp');

  const unsubscribe = composer.registerSubscriptions();
  composer.customDataManager.set('foo', 1);
  expect(spy).toHaveBeenCalledTimes(1);

  unsubscribe();
  composer.customDataManager.set('bar', 2);
  expect(spy).toHaveBeenCalledTimes(1);
});
