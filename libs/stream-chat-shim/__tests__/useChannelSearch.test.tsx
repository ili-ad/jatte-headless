import { renderHook, act } from '@testing-library/react';
import { useChannelSearch } from '../src/useChannelSearch';

describe('useChannelSearch', () => {
  test('returns default state', () => {
    const { result } = renderHook(() =>
      useChannelSearch({}) as any,
    );
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.searching).toBe(false);
  });

  test('selectResult throws', () => {
    const { result } = renderHook(() =>
      useChannelSearch({}) as any,
    );
    expect(() =>
      act(() => {
        (result.current as any).selectResult({});
      })
    ).toThrow('useChannelSearch not implemented');
  });
});
