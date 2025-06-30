import { setUserAgent } from '../src/chatSDKShim';

describe('setUserAgent', () => {
  it('POSTs user agent to backend', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve({ status: 'ok' }) });
    // @ts-ignore
    global.fetch = fetchMock;
    const res = await setUserAgent('ua/1');
    expect(fetchMock).toHaveBeenCalledWith('/api/core-user-agent/', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_agent: 'ua/1' }),
    });
    expect(res).toEqual({ status: 'ok' });
  });
});
