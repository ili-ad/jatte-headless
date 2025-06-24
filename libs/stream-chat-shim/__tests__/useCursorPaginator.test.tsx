import { renderHook } from '@testing-library/react';
import { useCursorPaginator } from '../src/useCursorPaginator';

describe('useCursorPaginator', () => {
  test('returns placeholder store and loadMore throws', async () => {
    const { result } = renderHook(() =>
      useCursorPaginator(async () => ({ items: [], next: undefined }))
    );

    const state = result.current.cursorPaginatorState.getLatestValue();
    expect(state.items).toEqual([]);
    expect(state.hasNextPage).toBe(true);
    expect(() => result.current.loadMore()).toThrow(
      'useCursorPaginator not implemented'
    );
  });
});
