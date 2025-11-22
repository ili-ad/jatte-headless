import { clientUpdateMessage } from '../src/chatSDKShim';

describe('clientUpdateMessage', () => {
  it('calls client.updateMessage when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const client = { updateMessage: fn } as any;
    const res = await clientUpdateMessage(client, '42', 'hi');
    expect(fn).toHaveBeenCalledWith('42', 'hi');
    expect(res).toBe('ok');
  });

  it('falls back to HTTP request when not implemented', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve('ok') });
    // @ts-ignore
    global.fetch = fetchMock;
    const res = await clientUpdateMessage({} as any, '42', 'hi');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/messages/42/');
    expect(init.method).toBe('PUT');
    expect((init.headers as Headers).get('Content-Type')).toBe(
      'application/json',
    );
    expect(JSON.parse(init.body as string)).toEqual({ body: 'hi' });
    expect(res).toBe('ok');
  });
});
