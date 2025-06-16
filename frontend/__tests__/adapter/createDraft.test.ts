import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

let setItemSpy: any;

beforeEach(() => {
  setItemSpy = vi.fn();
  (global as any).localStorage = {
    getItem: vi.fn(),
    setItem: setItemSpy,
    removeItem: vi.fn(),
  };
});

afterEach(() => {
  delete (global as any).localStorage;
});

test('createDraft saves current text to localStorage', () => {
  const client = new ChatClient('u1', 'jwt1');
  const channel = client.channel('messaging', 'room1');
  channel.messageComposer.textComposer.setText('draft message');

  channel.messageComposer.createDraft();
  expect(setItemSpy).toHaveBeenCalledWith('draft:undefined', 'draft message');
});
