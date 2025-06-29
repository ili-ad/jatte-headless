import { clientThreadsLoadNextPage } from '../src/chatSDKShim';

describe('clientThreadsLoadNextPage', () => {
  it('calls client.threads.loadNextPage when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const client = { threads: { loadNextPage: fn } } as any;
    const res = await clientThreadsLoadNextPage(client);
    expect(fn).toHaveBeenCalled();
    expect(res).toBe('ok');
  });

  it('falls back to HTTP request when not implemented', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve('ok') });
    // @ts-ignore
    global.fetch = fetchMock;
    const res = await clientThreadsLoadNextPage({} as any);
    expect(fetchMock).toHaveBeenCalledWith('/api/threads/', {
      credentials: 'same-origin',
    });
    expect(res).toBe('ok');
  });
});
