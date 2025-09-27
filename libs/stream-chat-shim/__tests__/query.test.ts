import { chatAPI } from '../src/api/chatAPI';
import { query } from '../src/chatSDKShim';

describe('query', () => {
  it('calls channel.query when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const res = await query({ cid: 'room1', query: fn } as any, { limit: 2 });
    expect(fn).toHaveBeenCalledWith({ watch: true, watchers: { limit: 2 } });
    expect(res).toBe('ok');
  });

  it('fetches members when not implemented', async () => {
    const spy = jest
      .spyOn(chatAPI, 'query')
      .mockResolvedValue({ members: ['m1'] as any });

    const res = await query({ cid: 'room2' } as any, { offset: 1 });

    expect(spy).toHaveBeenCalledWith({
      cid: 'room2',
      limit: undefined,
      offset: 1,
    });
    expect(res).toEqual({ members: ['m1'] });

    spy.mockRestore();
  });
});
