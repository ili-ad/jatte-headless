import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { EVENTS } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('optimistic messages reconcile with server echoes without duplication', async () => {
  let resolveFetch: (value: any) => void;
  (global.fetch as any).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
  );

  const client = new ChatClient('user-1', 'jwt');
  const channel = client.channel('messaging', 'room1');

  channel.messageComposer.textComposer.setText('hello world');
  const submission = channel.messageComposer.textComposer.submit();

  expect(channel.state.messages).toHaveLength(1);
  const localId = channel.state.messages[0]?.id;
  expect(localId).toBeTruthy();

  const serverMessage = {
    id: '42',
    text: 'hello world',
    user_id: 'user-1',
    created_at: '2025-01-01T00:00:00Z',
    client_generated_id: localId,
  };

  // Simulate ws echo arriving before HTTP response resolves
  channel.dispatchEvent({ type: EVENTS.MESSAGE_NEW, message: serverMessage });

  expect(channel.state.messages.find((m) => m.id === '42')).toBeTruthy();
  expect(channel.state.messages.find((m) => m.id === localId)).toBeUndefined();

  resolveFetch?.({ ok: true, json: async () => serverMessage });
  await submission;

  const matching = channel.state.messages.filter((m) => m.text === 'hello world');
  expect(matching).toHaveLength(1);
  expect(channel.state.latestMessages.at(-1)?.id).toBe('42');
});
