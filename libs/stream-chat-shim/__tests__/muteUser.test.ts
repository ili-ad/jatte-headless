import { muteUser } from '../src/chatSDKShim';

describe('muteUser', () => {
  it('posts to backend endpoint', async () => {
    const fetchMock = jest.fn().mockResolvedValue({});
    // @ts-ignore
    global.fetch = fetchMock;
    await muteUser('u2');
    expect(fetchMock).toHaveBeenCalledWith('/api/mute/u2/', {
      method: 'POST',
      credentials: 'same-origin',
    });
  });
});
