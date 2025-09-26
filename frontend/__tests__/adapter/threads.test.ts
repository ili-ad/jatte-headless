import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('getThreads fetches list and updates store', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => [{ id: 't1' }] });
  const client = new ChatClient('u1', 'jwt-test');
  const res = await client.getThreads();

  expect(global.fetch).toHaveBeenCalledWith(API.THREADS, {
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(res).toEqual([{ id: 't1' }]);
  expect(client.threads.state.getSnapshot().threads).toEqual([{ id: 't1' }]);
});

test('client.threads.deactivate clears active thread state', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');

  client.stateStore._set({ channels: [channel] });
  client.activeChannels[channel.cid] = channel;

  channel.messageComposer.setThreadId('thread-1');
  client.threads.state._set({
    activeThread: { id: 'thread-1' } as any,
    activeThreadCid: channel.cid,
    activeThreadId: 'thread-1',
  });

  const cleanup = vi.fn();
  (client as any).threadCleanupHandlers.add(cleanup);

  client.threads.deactivate();

  const snapshot = client.threads.state.getSnapshot();
  expect(snapshot.activeThread).toBeNull();
  expect(snapshot.activeThreadId).toBeNull();
  expect(snapshot.activeThreadCid).toBeNull();
  expect(channel.messageComposer.threadId).toBeUndefined();
  expect(cleanup).toHaveBeenCalled();
});
