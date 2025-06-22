import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { ChatClient } from '../../src/lib/stream-adapter/ChatClient';
import { API, EVENTS } from '../../src/lib/stream-adapter/constants';

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

  const client = new ChatClient('u1', 'jwt-test');
  const spy = vi.fn();
  client.on(EVENTS.SETTINGS_UPDATED, spy);
  const settings = await client.getAppSettings();

  expect(global.fetch).toHaveBeenCalledWith(API.APP_SETTINGS, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-test',
    },
  });
  expect(settings).toEqual({ file_uploads: true });
  expect(client.settingsStore.getSnapshot()).toEqual({ file_uploads: true });
  expect(spy).toHaveBeenCalledWith({ file_uploads: true });
});
