import { clientThreadsReload } from '../src/chatSDKShim';

describe('clientThreadsReload', () => {
  it('calls client.threads.reload when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const client = { threads: { reload: fn } } as any;
    const res = await clientThreadsReload(client);
    expect(fn).toHaveBeenCalled();
    expect(res).toBe('ok');
  });

  it('falls back to HTTP request when not implemented', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ json: () => Promise.resolve('ok') });
    // @ts-ignore
    global.fetch = fetchMock;
    const res = await clientThreadsReload({} as any);
    expect(fetchMock).toHaveBeenCalledWith('/api/threads/', { credentials: 'same-origin' });
    expect(res).toBe('ok');
  });
});
