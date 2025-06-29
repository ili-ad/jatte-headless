import { getUserAgent } from '../src/chatSDKShim';

describe('getUserAgent', () => {
  it('fetches user agent from backend', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve({ user_agent: 'ua' }) });
    // @ts-ignore
    global.fetch = fetchMock;
    const ua = await getUserAgent();
    expect(fetchMock).toHaveBeenCalledWith('/api/user-agent/', {
      credentials: 'same-origin',
    });
    expect(ua).toBe('ua');
  });
});
