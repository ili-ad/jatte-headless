import { validateAndGetMessage } from '../utils';
import { useChannelStateContext, useTranslationContext } from '../../../context';

import type { LocalMessage } from 'chat-shim';
import type { ReactEventHandler } from '../types';

export type MarkUnreadHandlerNotifications = {
  getErrorNotification?: (message: LocalMessage) => string;
  getSuccessNotification?: (message: LocalMessage) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const useMarkUnreadHandler = (
  message?: LocalMessage,
  notifications: MarkUnreadHandlerNotifications = {},
): ReactEventHandler => {
  const { getErrorNotification, getSuccessNotification, notify } = notifications;

  const { channel } = useChannelStateContext('useMarkUnreadHandler');
  const { t } = useTranslationContext('useMarkUnreadHandler');

  return async (event) => {
    event.preventDefault();
    if (!message?.id) {
      console.warn('Mark unread handler does not have access to message id');
      return;
    }

    try {
      await Promise.resolve(
        /* TODO backend-wire-up: markUnread */ undefined,
      );
      if (!notify) return;
      const successMessage =
        getSuccessNotification &&
        validateAndGetMessage(getSuccessNotification, [message]);
      if (successMessage) notify(successMessage, 'success');
    } catch (e) {
      if (!notify) return;
      const errorMessage =
        getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);
      if (getErrorNotification && !errorMessage) return;
      notify(
        errorMessage ||
          t(
            'Error marking message unread. Cannot mark unread messages older than the newest 100 channel messages.',
          ),
        'error',
      );
    }
  };
};
