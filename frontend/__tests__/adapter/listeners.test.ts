import { expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { EVENTS } from '../../src/lib/stream-adapter/constants';

test('on stores listener in listeners map', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const spy = vi.fn();
  client.on(EVENTS.MESSAGE_NEW, spy);
  expect(client.listeners[EVENTS.MESSAGE_NEW]).toContain(spy);
});

test('off removes listener from listeners map', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const spy = vi.fn();
  client.on(EVENTS.MESSAGE_NEW, spy);
  client.off(EVENTS.MESSAGE_NEW, spy);
  expect(client.listeners[EVENTS.MESSAGE_NEW] || []).not.toContain(spy);
});
