import { renderHook } from '@testing-library/react';
import { useChannelListShape } from '../src/useChannelListShape';

describe('useChannelListShape', () => {
  test('returns undefined', () => {
    const { result } = renderHook(() => useChannelListShape(() => {} as any));
    expect(result.current).toBeUndefined();
  });
});
