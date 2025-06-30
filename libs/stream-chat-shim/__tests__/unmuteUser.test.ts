import { unmuteUser } from '../src/chatSDKShim';

describe('unmuteUser', () => {
  it('posts to backend endpoint', async () => {
    const fetchMock = jest.fn().mockResolvedValue({});
    // @ts-ignore
    global.fetch = fetchMock;
    await unmuteUser('u2');
    expect(fetchMock).toHaveBeenCalledWith('/api/unmute/u2/', {
      method: 'POST',
      credentials: 'same-origin',
    });
  });
});
