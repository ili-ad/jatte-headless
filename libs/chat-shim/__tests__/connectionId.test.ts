/// <reference types="jest" />
import { expect, test } from '@jest/globals';

beforeEach(() => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ connection_id: 'c1' }) })
    .mockResolvedValue({ ok: true, json: async () => ({ connection_id: 'c1' }) });
});

afterEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

test('connection-id stable for same session', async () => {
  const res1 = await fetch('/api/connection-id');
  const cid1 = (await res1.json()).connection_id;
  const res2 = await fetch('/api/connection-id');
  const cid2 = (await res2.json()).connection_id;
  expect(cid1).toBe(cid2);
});

test('connection-id unique across sessions', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ connection_id: 'c1' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ connection_id: 'c2' }) });
  const c1 = (await (await fetch('/api/connection-id')).json()).connection_id;
  const c2 = (await (await fetch('/api/connection-id')).json()).connection_id;
  expect(c1).not.toBe(c2);
});
