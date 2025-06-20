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

test('add posts to backend and stores preview', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ url: 'https://x.com', title: 'x' }),
  });
  const client = new ChatClient('u1', 'jwt-test');
  const channel = client.channel('messaging', 'room1');
  const mgr: any = channel.messageComposer.linkPreviewsManager;
  await mgr.add('https://x.com');
  expect(global.fetch).toHaveBeenCalledWith(API.LINK_PREVIEW, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
    body: JSON.stringify({ url: 'https://x.com' }),
  });
  expect(mgr.state.getSnapshot().previews).toEqual([
    { url: 'https://x.com', title: 'x' },
  ]);
});

test('remove and clear update state', () => {
  const client = new ChatClient('u1', 'jwt-test');
  const mgr: any = client.channel('messaging', 'room1').messageComposer.linkPreviewsManager;
  mgr.state._set({ previews: [{ url: 'a' }, { url: 'b' }] });
  mgr.remove('a');
  expect(mgr.state.getSnapshot().previews).toEqual([{ url: 'b' }]);
  mgr.clear();
  expect(mgr.state.getSnapshot().previews).toEqual([]);
});
