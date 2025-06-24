import { act, renderHook } from '@testing-library/react';
import { useSearchQueriesInProgress } from '../src/useSearchQueriesInProgress';

describe('useSearchQueriesInProgress', () => {
  it('tracks the number of in-flight search queries', () => {
    const { result } = renderHook(() => useSearchQueriesInProgress());

    expect(result.current.queriesInProgress).toBe(0);

    act(() => {
      result.current.startQuery();
    });
    expect(result.current.queriesInProgress).toBe(1);

    act(() => {
      result.current.endQuery();
    });
    expect(result.current.queriesInProgress).toBe(0);
  });
});
