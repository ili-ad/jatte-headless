import { renderHook } from '@testing-library/react';
import type { StreamChat } from 'stream-chat';
import { useReactionsFetcher } from '../src/useReactionsFetcher';

describe('useReactionsFetcher', () => {
  test('returns placeholder structure', async () => {
    const client = {} as StreamChat;
    const { result } = renderHook(() =>
      useReactionsFetcher({ client, messageId: '1' })
    );
    expect(Array.isArray(result.current.reactions)).toBe(true);
    expect(typeof result.current.hasNextPage).toBe('boolean');
    await expect(result.current.fetchNextPage()).rejects.toThrow(
      'useReactionsFetcher not implemented'
    );
  });
});
