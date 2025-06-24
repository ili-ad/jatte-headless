import { renderHook } from '@testing-library/react';
import type { StreamChat } from 'stream-chat';
import { usePaginatedChannels } from '../src/usePaginatedChannels';

const noop = () => {};

describe('usePaginatedChannels', () => {
  test('returns placeholder structure', () => {
    const client = {} as StreamChat;
    const { result } = renderHook(() =>
      usePaginatedChannels(client, {}, {}, {}, noop)
    );
    expect(Array.isArray(result.current.channels)).toBe(true);
    expect(typeof result.current.hasNextPage).toBe('boolean');
    expect(() => result.current.loadNextPage()).toThrow(
      'usePaginatedChannels not implemented'
    );
  });
});
