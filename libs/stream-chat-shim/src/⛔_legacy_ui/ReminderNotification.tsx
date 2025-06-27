import React from 'react';
import type { Reminder } from 'chat-shim';

export type ReminderNotificationProps = {
  /** Reminder object associated with the notification. */
  reminder?: Reminder;
};

/** Placeholder ReminderNotification component. */
export const ReminderNotification = (_props: ReminderNotificationProps) => (
  <div data-testid="reminder-notification-placeholder">
    ReminderNotification placeholder
  </div>
);

export default ReminderNotification;
