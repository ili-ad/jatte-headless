import { setUserAgent } from '../src/chatSDKShim';

describe('setUserAgent', () => {
  it('POSTs user agent to backend', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ user_agent: 'ua/1' }),
      });
    // @ts-ignore
    global.fetch = fetchMock;
    const res = await setUserAgent('ua/1');
    expect(fetchMock).toHaveBeenCalledWith('/api/user-agent/', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_agent: 'ua/1' }),
    });
    expect(res).toEqual({ user_agent: 'ua/1' });
  });
});
