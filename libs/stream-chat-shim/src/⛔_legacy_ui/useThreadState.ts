import type { ThreadState } from 'chat-shim';

/**
 * Placeholder implementation of Stream's `useThreadState` hook.
 * TODO: wire up thread contexts when available.
 */
export const useThreadState = <T extends readonly unknown[]>(
  _selector: (nextValue: ThreadState) => T,
): T => {
  throw new Error('useThreadState not implemented');
};
