import { threadsRegisterSubscriptions } from '../src/chatSDKShim';

describe('threadsRegisterSubscriptions', () => {
  it('POSTs to backend endpoint', async () => {
    const fetchMock = jest.fn().mockResolvedValue({});
    // @ts-ignore
    global.fetch = fetchMock;
    await threadsRegisterSubscriptions({ jwt: 'tok' });
    expect(fetchMock).toHaveBeenCalledWith('/api/register-subscriptions/', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Authorization: 'Bearer tok' },
    });
  });
});
