import { renderHook } from '@testing-library/react';
import { useUserPresenceChangedListener } from '../src/useUserPresenceChangedListener';

test('useUserPresenceChangedListener mounts without errors', () => {
  const { result } = renderHook(() =>
    useUserPresenceChangedListener(jest.fn())
  );
  expect(result.error).toBeUndefined();
});
