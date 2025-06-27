import type { BaseSyntheticEvent } from 'react';
import type { LocalMessage } from 'chat-shim';

/** Match Stream's ReactEventHandler type. */
export type ReactEventHandler = (event: BaseSyntheticEvent) => Promise<void> | void;

export type MarkUnreadHandlerNotifications = {
  getErrorNotification?: (message: LocalMessage) => string;
  getSuccessNotification?: (message: LocalMessage) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

/**
 * Placeholder implementation of Stream's `useMarkUnreadHandler` hook.
 *
 * Returns a callback that throws until the real behaviour is implemented.
 */
export function useMarkUnreadHandler(
  _message?: LocalMessage,
  _notifications: MarkUnreadHandlerNotifications = {},
): ReactEventHandler {
  return () => {
    throw new Error('useMarkUnreadHandler not implemented');
  };
}
