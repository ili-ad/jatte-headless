import { clientThreadsReload } from '../src/chatSDKShim';

describe('clientThreadsReload', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      // @ts-ignore
      delete global.fetch;
    }
  });

  it('calls client.threads.reload when available', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const client = { threads: { reload: fn } } as any;
    await clientThreadsReload(client);
    expect(fn).toHaveBeenCalled();
  });

  it('no-ops when reload implementation is missing', async () => {
    const fetchMock = jest.fn();
    // @ts-ignore
    global.fetch = fetchMock;

    await expect(clientThreadsReload({} as any)).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
