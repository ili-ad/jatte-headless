import { renderHook } from '@testing-library/react';
import { usePinHandler } from '../src/usePinHandler';

describe('usePinHandler', () => {
  test('returns placeholder handler', () => {
    const { result } = renderHook(() => usePinHandler({} as any));
    expect(result.current.canPin).toBe(false);
    expect(() => result.current.handlePin({} as any)).toThrow('usePinHandler not implemented');
  });
});
