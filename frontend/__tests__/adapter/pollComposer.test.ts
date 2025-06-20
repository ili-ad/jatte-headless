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

test('create posts poll and stores result', async () => {
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ poll: { id: 'p1', question: 'q1', options: ['a'] } }),
  });
  const client = new ChatClient('u1', 'jwt-test');
  const comp: any = client.channel('messaging', 'r1').messageComposer.pollComposer;
  await comp.create('q1', ['a']);
  expect(global.fetch).toHaveBeenCalledWith(API.POLLS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
    body: JSON.stringify({ question: 'q1', options: ['a'] }),
  });
  expect(comp.state.getSnapshot().poll).toEqual({ id: 'p1', question: 'q1', options: ['a'] });
});

test('remove deletes poll and clears state', async () => {
  (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });
  const client = new ChatClient('u1', 'jwt-test');
  const comp: any = client.channel('messaging', 'r1').messageComposer.pollComposer;
  comp.state._set({ poll: { id: 'p2', question: 'q2' } });
  await comp.remove();
  expect(global.fetch).toHaveBeenCalledWith(`${API.POLLS}p2/`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer jwt-test' },
  });
  expect(comp.state.getSnapshot().poll).toBeUndefined();
});

test('reset clears poll', () => {
  const comp: any = new ChatClient('u1', 'jwt-test').channel('messaging', 'r2').messageComposer.pollComposer;
  comp.state._set({ poll: { id: 'p3' } });
  comp.reset();
  expect(comp.state.getSnapshot().poll).toBeUndefined();
});
