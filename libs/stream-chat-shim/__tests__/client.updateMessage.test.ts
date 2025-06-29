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
    expect(fetchMock).toHaveBeenCalledWith('/api/messages/42/', expect.objectContaining({ method: 'PUT' }));
    expect(res).toBe('ok');
  });
});
