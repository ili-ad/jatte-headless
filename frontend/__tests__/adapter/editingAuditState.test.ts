import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API } from '../../src/lib/stream-adapter/constants';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
  (global as any).localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
});

afterEach(() => {
  global.fetch = originalFetch;
  delete (global as any).localStorage;
  vi.restoreAllMocks();
});

test('editingAuditState updates on text and draft changes', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  const composer: any = channel.messageComposer;
  const initial = composer.editingAuditState.getSnapshot().lastChange.stateUpdate;
  composer.textComposer.setText('hi');
  const afterText = composer.editingAuditState.getSnapshot().lastChange.stateUpdate;
  expect(afterText).toBeGreaterThanOrEqual(initial);

  composer.createDraft();
  const last = composer.editingAuditState.getSnapshot().lastChange;
  expect(last.draftUpdate).not.toBeNull();
  expect(last.stateUpdate).toBe(last.draftUpdate);
  expect(global.fetch).toHaveBeenCalledWith(API.EDITING_AUDIT_STATE, expect.objectContaining({ method: 'POST' }));
});
