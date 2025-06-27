import type { ReminderResponse } from 'chat-shim';

/**
 * Placeholder generator for reminder objects used in tests.
 * Mirrors the Stream Chat mock builder API but throws until implemented.
 */
export const reminder = (_overrides: Partial<ReminderResponse> = {}): ReminderResponse => {
  throw new Error('reminder shim not implemented');
};

export default reminder;
