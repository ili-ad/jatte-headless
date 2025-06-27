import type { LocalMessage } from 'chat-shim';
import type React from 'react';

export type ReactEventHandler = (
  event: React.BaseSyntheticEvent,
) => Promise<void> | void;

export type DeleteMessageNotifications = {
  getErrorNotification?: (message: LocalMessage) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

/**
 * Placeholder implementation for Stream's `useDeleteHandler` hook.
 * Returns a handler that throws to indicate the behaviour is not implemented.
 */
export const useDeleteHandler = (
  _message?: LocalMessage,
  _notifications: DeleteMessageNotifications = {},
): ReactEventHandler => {
  return async () => {
    throw new Error('useDeleteHandler not implemented');
  };
};
