import { renderHook, act } from '@testing-library/react';
import { useCooldownTimer } from '../src/components/MessageInput/hooks/useCooldownTimer';

test('useCooldownTimer exposes cooldown state', () => {
  const { result } = renderHook(() => useCooldownTimer());
  expect(result.current.cooldownInterval).toBe(0);
  expect(result.current.cooldownRemaining).toBeUndefined();
  act(() => {
    result.current.setCooldownRemaining(5);
  });
  expect(result.current.cooldownRemaining).toBe(5);
});
