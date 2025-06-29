import { clientQueryUsers } from '../src/chatSDKShim';

describe('clientQueryUsers', () => {
  it('fetches users from backend', async () => {
    const users = [{ id: 1, username: 'test' }];
    const fetchMock = jest.fn().mockResolvedValue({ json: () => Promise.resolve(users) });
    // @ts-ignore
    global.fetch = fetchMock;
    const res = await clientQueryUsers();
    expect(fetchMock).toHaveBeenCalledWith('/api/users/', { credentials: 'same-origin' });
    expect(res).toEqual({ users });
  });
});
