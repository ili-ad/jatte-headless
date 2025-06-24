import { renderHook } from '@testing-library/react';
import { useMarkUnreadHandler } from '../src/useMarkUnreadHandler';

describe('useMarkUnreadHandler', () => {
  test('throws when invoked', () => {
    const { result } = renderHook(() => useMarkUnreadHandler());
    expect(() => result.current({ preventDefault() {} } as any)).toThrow(
      'useMarkUnreadHandler not implemented'
    );
  });
});
