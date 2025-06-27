import type { LocalMessage } from 'chat-shim';

export type FlagMessageNotifications = {
  getErrorNotification?: (message: LocalMessage) => string;
  getSuccessNotification?: (message: LocalMessage) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export type ReactEventHandler = (
  event: React.SyntheticEvent,
) => void | Promise<void>;

/**
 * Placeholder implementation for Stream's `useFlagHandler` hook.
 */
export const useFlagHandler = (
  _message?: LocalMessage,
  _notifications: FlagMessageNotifications = {},
): ReactEventHandler => {
  return async (event) => {
    event.preventDefault();
    throw new Error('useFlagHandler not implemented');
  };
};
