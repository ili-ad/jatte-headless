import type { LocalMessage } from 'chat-shim';

export type ReactEventHandler = (event: React.BaseSyntheticEvent) => void;

/**
 * Placeholder implementation of Stream's `useOpenThreadHandler` hook.
 * Returns a handler that throws to indicate missing implementation.
 */
export const useOpenThreadHandler = (
  _message?: LocalMessage,
  _customOpenThread?: (message: LocalMessage, event: React.BaseSyntheticEvent) => void,
): ReactEventHandler => {
  return () => {
    throw new Error('useOpenThreadHandler not implemented');
  };
};
