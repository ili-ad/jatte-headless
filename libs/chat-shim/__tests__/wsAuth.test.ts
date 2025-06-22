/// <reference types="jest" />

import { expect, test } from '@jest/globals';

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ auth: 'ok' }) });
});

afterEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

test('ws-auth returns 200', async () => {
  const res = await fetch('/api/ws-auth');
  expect(global.fetch).toHaveBeenCalledWith('/api/ws-auth');
  const data = await res.json();
  expect(data).toEqual({ auth: 'ok' });
});
