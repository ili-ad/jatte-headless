import React from 'react';
import type { Reminder } from 'stream-chat';

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
