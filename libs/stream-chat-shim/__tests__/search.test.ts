import { search } from '../src/chatSDKShim';

describe('search', () => {
  it('delegates to client.search when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const res = await search({ search: fn } as any, { cid: '1' }, { text: 'x' }, { limit: 2 });
    expect(fn).toHaveBeenCalledWith({ cid: '1' }, { text: 'x' }, { limit: 2 });
    expect(res).toBe('ok');
  });

  it('POSTs to /api/search/ when not implemented', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ json: () => Promise.resolve({ results: [] }) });
    // @ts-ignore
    global.fetch = fetchMock;
    const res = await search(undefined as any, { cid: '1' }, { text: 'x' }, { limit: 2 });
    expect(fetchMock).toHaveBeenCalledWith('/api/search/', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filter: { cid: '1' }, query: { text: 'x' }, options: { limit: 2 } }),
    });
    expect(res).toEqual({ results: [] });
  });
});
