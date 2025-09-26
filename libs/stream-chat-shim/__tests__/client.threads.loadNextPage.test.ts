import type { LoadNextPageArgs } from '../src/api/chatAPI';
import { clientThreadsLoadNextPage } from '../src/chatSDKShim';

const persistedMessage = {
  id: 42,
  body: 'hello',
  sent_by: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
};

describe('clientThreadsLoadNextPage', () => {
  it('normalizes results and forwards arguments to the client', async () => {
    const args: LoadNextPageArgs = {
      cid: 'channel_123',
      parentId: 'parent-message',
      limit: 25,
      cursor: 'cursor-1',
    };

    const loadNextPage = jest.fn().mockResolvedValue({
      messages: [
        { ...persistedMessage },
        { id: 'invalid', body: 1, sent_by: 'user-2', created_at: 'oops' },
      ],
      next_cursor: 'next-cursor',
      has_more: true,
    });

    const client = { threads: { loadNextPage } } as any;

    const result = await clientThreadsLoadNextPage(client, args);

    expect(loadNextPage).toHaveBeenCalledWith({
      cid: 'channel_123',
      parentId: 'parent-message',
      parent_id: 'parent-message',
      limit: 25,
      cursor: 'cursor-1',
    });

    expect(result).toEqual({
      messages: [persistedMessage],
      nextCursor: 'next-cursor',
      hasMore: true,
    });
  });

  it('returns an empty page when loadNextPage is unavailable', async () => {
    const result = await clientThreadsLoadNextPage({} as any);
    expect(result).toEqual({ messages: [], hasMore: false });
  });
});
