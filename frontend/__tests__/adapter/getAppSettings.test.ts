import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test('getAppSettings fetches settings from backend', async () => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({ file_uploads: true }),
  });

  const client = new ChatClient('u1', 'jwt1');
  const settings = await client.getAppSettings();

  expect(global.fetch).toHaveBeenCalledWith('/api/app-settings/', {
    headers: { Authorization: 'Bearer jwt1' },
  });
  expect(settings).toEqual({ file_uploads: true });
});
