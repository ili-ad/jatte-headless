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

test('axiosInstance.get wraps fetch', async () => {
  (global.fetch as any).mockResolvedValue({
    status: 200,
    statusText: 'OK',
    json: async () => ({ ok: true }),
  });

  const client = new ChatClient('u1', 'jwt-test');
  const result = await client.axiosInstance.get('/api/test', { headers: { 'X-Test': '1' } });

  expect(global.fetch).toHaveBeenCalledWith('/api/test', {
    method: 'GET',
    headers: { Authorization: 'Bearer jwt-test', 'X-Test': '1' },
  });
  expect(result).toEqual({ data: { ok: true }, status: 200, statusText: 'OK' });
});
