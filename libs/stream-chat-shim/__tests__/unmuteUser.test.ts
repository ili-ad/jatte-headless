import { unmuteUser } from '../src/chatSDKShim';

describe('unmuteUser', () => {
  it('posts to backend endpoint', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ target_user_id: 2, muted: false }),
    });
    // @ts-ignore
    global.fetch = fetchMock;
    await unmuteUser(2);
    expect(fetchMock).toHaveBeenCalledWith('/api/user-mutes/unmute/', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: 2 }),
    });
  });
});
