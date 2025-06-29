import { query } from '../src/chatSDKShim';

describe('query', () => {
  it('calls channel.query when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const res = await query({ cid: 'room1', query: fn } as any, { limit: 2 });
    expect(fn).toHaveBeenCalledWith({ watch: true, watchers: { limit: 2 } });
    expect(res).toBe('ok');
  });

  it('fetches members when not implemented', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve(['m1']) });
    // @ts-ignore
    global.fetch = fetchMock;
    const res = await query({ cid: 'room2' } as any, { offset: 1 });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/rooms/room2/members/?offset=1',
      { credentials: 'same-origin' },
    );
    expect(res).toEqual({ members: ['m1'] });
  });
});
