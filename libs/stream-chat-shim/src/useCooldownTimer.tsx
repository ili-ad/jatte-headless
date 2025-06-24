import { useState } from 'react';
import type React from 'react';

export type CooldownTimerState = {
  cooldownInterval: number;
  setCooldownRemaining: React.Dispatch<React.SetStateAction<number | undefined>>;
  cooldownRemaining?: number;
};

/**
 * Minimal placeholder for Stream's `useCooldownTimer` hook.
 * Provides cooldown state but omits integration with Stream Chat contexts.
 */
export const useCooldownTimer = (): CooldownTimerState => {
  const [cooldownRemaining, setCooldownRemaining] = useState<number>();

  return {
    cooldownInterval: 0,
    cooldownRemaining,
    setCooldownRemaining,
  };
};

export default useCooldownTimer;
