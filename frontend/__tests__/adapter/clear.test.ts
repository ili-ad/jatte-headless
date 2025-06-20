import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
  (global as any).localStorage = { removeItem: vi.fn() };
});

afterEach(() => {
  global.fetch = originalFetch;
  delete (global as any).localStorage;
  vi.restoreAllMocks();
});

test('clear resets composer and deletes draft', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  const comp: any = channel.messageComposer;

  comp.textComposer.setText('hello');
  comp.customDataManager.set('foo', 1);

  comp.clear();

  expect(comp.textComposer.state.getSnapshot().text).toBe('');
  expect(comp.customDataManager.state.getSnapshot().customData).toEqual({});
  expect(global.fetch).toHaveBeenCalledWith(`${API.ROOMS}room1/draft/`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer jwt-test' },
  });
});

