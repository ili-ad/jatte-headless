import type { ThreadManagerState } from 'stream-chat';

/**
 * Placeholder implementation for Stream's `useThreadManagerState` hook.
 *
 * Once integrated with the chat context, this hook should subscribe to the
 * thread manager state store and return the selected slice of state.
 */
export const useThreadManagerState = <T extends readonly unknown[]>(
  _selector: (nextValue: ThreadManagerState) => T,
): T | undefined => {
  // TODO: connect to the Stream Chat client's thread manager state
  // when the Chat context becomes available.
  return undefined;
};

export default useThreadManagerState;
