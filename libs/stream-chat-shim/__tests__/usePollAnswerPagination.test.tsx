import { renderHook } from '@testing-library/react';
import { usePollAnswerPagination } from '../src/usePollAnswerPagination';

describe('usePollAnswerPagination', () => {
  test('returns placeholder values and loadMore throws', () => {
    const { result } = renderHook(() => usePollAnswerPagination());

    expect(result.current.answers).toEqual([]);
    expect(result.current.hasNextPage).toBe(true);
    expect(() => result.current.loadMore()).toThrow('usePollAnswerPagination not implemented');
  });
});
