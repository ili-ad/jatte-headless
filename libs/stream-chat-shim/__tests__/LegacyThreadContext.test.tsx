import { renderHook } from '@testing-library/react';
import { useLegacyThreadContext } from '../src/LegacyThreadContext';

describe('LegacyThreadContext', () => {
  it('provides default value', () => {
    const { result } = renderHook(() => useLegacyThreadContext());
    expect(result.current).toEqual({ legacyThread: undefined });
  });
});
