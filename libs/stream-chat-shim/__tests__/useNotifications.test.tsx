import { renderHook } from '@testing-library/react';
import { useNotifications } from '../src/useNotifications';

describe('useNotifications', () => {
  test('returns an empty array by default', () => {
    const { result } = renderHook(() => useNotifications());
    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current.length).toBe(0);
  });
});
