import type { LocalMessage } from 'stream-chat';

/**
 * Placeholder implementation of Stream's `useSearchFocusedMessage` hook.
 *
 * Returns the message currently focused in search results.
 * This shim does not connect to Stream Chat state and always returns `null`.
 */
export const useSearchFocusedMessage = (): LocalMessage | null => {
  // TODO: integrate with real search controller state
  return null;
};

export default useSearchFocusedMessage;
