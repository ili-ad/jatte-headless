import { useEffect } from 'react';
import type { Reminder } from 'chat-shim';

/**
 * Placeholder implementation of Stream's `useMessageReminder` hook.
 * Returns the reminder associated with a message once implemented.
 */
export const useMessageReminder = (
  _messageId: string,
): Reminder | undefined => {
  useEffect(() => {
    // TODO: connect to ReminderManager when ported
  }, [_messageId]);

  return undefined;
};
