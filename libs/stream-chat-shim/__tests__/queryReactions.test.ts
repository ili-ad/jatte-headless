import { queryReactions } from '../src/chatSDKShim';

describe('queryReactions', () => {
  it('calls message.queryReactions when available', async () => {
    const fn = jest
      .fn()
      .mockResolvedValue({ next: 'n1', reactions: ['a'] });
    const res = await queryReactions(
      { id: 'm1', queryReactions: fn } as any,
      { limit: 5 },
    );
    expect(fn).toHaveBeenCalledWith({ limit: 5 });
    expect(res).toEqual({ next: 'n1', reactions: ['a'] });
  });

  it('fetches reactions when not implemented', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ next: 'n2', reactions: ['b'] }),
    });
    // @ts-ignore
    global.fetch = fetchMock;
    const res = await queryReactions(
      { id: 'm2' } as any,
      { next: 'cur', reaction_type: 'like' },
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/messages/m2/reactions/?next=cur&reaction_type=like',
      { credentials: 'same-origin' },
    );
    expect(res).toEqual({ next: 'n2', reactions: ['b'] });
  });
});
