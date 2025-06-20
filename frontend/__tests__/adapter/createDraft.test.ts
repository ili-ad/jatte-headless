import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

let setItemSpy: any;
const originalFetch = global.fetch;

beforeEach(() => {
  setItemSpy = vi.fn();
  (global as any).localStorage = {
    getItem: vi.fn(),
    setItem: setItemSpy,
    removeItem: vi.fn(),
  };
  global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
});

afterEach(() => {
  delete (global as any).localStorage;
  global.fetch = originalFetch;
});

test('createDraft saves current text to localStorage and posts draft', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  channel.messageComposer.textComposer.setText('draft message');

  channel.messageComposer.createDraft();
  expect(setItemSpy).toHaveBeenCalledWith('draft:room1', 'draft message');
  expect(global.fetch).toHaveBeenCalledWith(`${API.ROOMS}room1/draft/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
    body: JSON.stringify({ text: 'draft message' }),
  });
});
