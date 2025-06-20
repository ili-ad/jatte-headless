import { expect, test, vi, beforeEach, afterEach } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

let originalFetch: any;

beforeEach(() => {
  originalFetch = global.fetch;
  global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

/** ensure registerSubscriptions wires store listeners */
test('registerSubscriptions subscribes and unsubscribes', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  const composer: any = channel.messageComposer;
  const spy = vi.spyOn(composer, 'logStateUpdateTimestamp');

  const unsubscribe = composer.registerSubscriptions();
  composer.customDataManager.set('foo', 1);
  expect(spy).toHaveBeenCalledTimes(1);

  unsubscribe();
  composer.customDataManager.set('bar', 2);
  expect(spy).toHaveBeenCalledTimes(1);

  expect(global.fetch).toHaveBeenCalledWith(API.REGISTER_SUBSCRIPTIONS, {
    method: 'POST',
    headers: { Authorization: 'Bearer jwt-test' },
  });
});
