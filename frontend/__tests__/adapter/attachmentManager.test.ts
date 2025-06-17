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

test('addFiles posts each file and stores attachments', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ attachment: { id: 'a1', name: 'f1' } }),
  });
  const client = new ChatClient('u1', 'jwt1');
  const mgr: any = client.channel('messaging', 'r1').messageComposer.attachmentManager;
  await mgr.addFiles([{ name: 'f1' } as any]);
  expect(global.fetch).toHaveBeenCalledWith(API.ATTACHMENTS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt1',
    },
    body: JSON.stringify({ name: 'f1' }),
  });
  expect(mgr.state.getSnapshot().attachments).toEqual([{ id: 'a1', name: 'f1' }]);
});

test('remove and replace update state', () => {
  const client = new ChatClient('u1', 'jwt1');
  const mgr: any = client.channel('messaging', 'r1').messageComposer.attachmentManager;
  const a = { id: 'a1', name: 'x' };
  const b = { id: 'a2', name: 'y' };
  mgr.state._set({ attachments: [a, b] });
  mgr.removeAttachment('a1');
  expect(mgr.state.getSnapshot().attachments).toEqual([b]);
  mgr.replaceAttachment(b, { id: 'a3', name: 'z' });
  expect(mgr.state.getSnapshot().attachments).toEqual([{ id: 'a3', name: 'z' }]);
});
