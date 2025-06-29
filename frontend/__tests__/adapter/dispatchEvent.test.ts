import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API, EVENTS } from '../../src/lib/stream-adapter/constants';

const message = { id: 'm1', text: 'hi', user_id: 'u2', created_at: '2025-01-01T00:00:00Z' };

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('dispatchEvent forwards message.new to channel and client', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  // mark as active channel so dispatchEvent can find it
  client.activeChannels[channel.cid] = channel as any;

  const clientSpy = vi.fn();
  const chanSpy = vi.fn();
  client.on(EVENTS.MESSAGE_NEW, clientSpy);
  channel.on(EVENTS.MESSAGE_NEW, chanSpy);

  client.dispatchEvent({ type: EVENTS.MESSAGE_NEW, cid: channel.cid, message });

  expect(global.fetch).toHaveBeenCalledWith(`/api${API.DISPATCH_EVENT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
    body: JSON.stringify({ type: EVENTS.MESSAGE_NEW, cid: channel.cid, message }),
  });

  expect(channel.state.messages.at(-1)).toEqual(message);
  expect(clientSpy).toHaveBeenCalledWith({ type: EVENTS.MESSAGE_NEW, cid: channel.cid, message });
  expect(chanSpy).toHaveBeenCalledWith({ type: EVENTS.MESSAGE_NEW, cid: channel.cid, message });
});

test('dispatchEvent forwards typing events', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  client.activeChannels[channel.cid] = channel as any;

  const clientSpy = vi.fn();
  const chanSpy = vi.fn();
  client.on('typing.start', clientSpy);
  channel.on('typing.start', chanSpy);

  client.dispatchEvent({ type: 'typing.start', cid: channel.cid, user_id: 'u2' });

  expect(global.fetch).toHaveBeenCalledWith(`/api${API.DISPATCH_EVENT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
    body: JSON.stringify({ type: 'typing.start', cid: channel.cid, user_id: 'u2' }),
  });

  expect(clientSpy).toHaveBeenCalledWith({ type: 'typing.start', cid: channel.cid, user_id: 'u2' });
  expect(chanSpy).toHaveBeenCalledWith({ type: 'typing.start', cid: channel.cid, user_id: 'u2' });
});
