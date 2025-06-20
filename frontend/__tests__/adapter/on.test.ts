import { expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { EVENTS } from '../../src/lib/stream-adapter/constants';

test('on registers event listener', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const spy = vi.fn();
  client.on(EVENTS.MESSAGE_NEW, spy);

  client.emit(EVENTS.MESSAGE_NEW, { message: { id: 'm1', text: 'hi', user_id: 'u1', created_at: '2025-01-01T00:00:00Z' } });

  expect(spy).toHaveBeenCalledTimes(1);
});
