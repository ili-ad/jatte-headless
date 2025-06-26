import type { ThreadState } from 'stream-chat';

/**
 * Placeholder implementation of Stream's `useThreadState` hook.
 * TODO: wire up thread contexts when available.
 */
export const useThreadState = <T extends readonly unknown[]>(
  _selector: (nextValue: ThreadState) => T,
): T => {
  throw new Error('useThreadState not implemented');
};
