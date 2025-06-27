// libs/stream-chat-shim/src/MessageTimestamp.tsx
import React from 'react';
import type { LocalMessage } from 'chat-shim';

/** Options that configure how the timestamp is formatted. */
export type TimestampFormatterOptions = {
  /** Use calendar style formatting. */
  calendar?: boolean;
  /** Date formats to use when calendar formatting is enabled. */
  calendarFormats?: Record<string, string>;
  /** Format string when calendar formatting is disabled. */
  format?: string;
};

export type MessageTimestampProps = TimestampFormatterOptions & {
  /** Adds a CSS class name to the outer time element. */
  customClass?: string;
  /** Message providing the timestamp to display. */
  message?: LocalMessage;
};

/**
 * Placeholder implementation of the MessageTimestamp component.
 * It simply renders the message creation date.
 */
export function MessageTimestamp({ customClass, message }: MessageTimestampProps) {
  const timestamp =
    typeof message?.created_at === 'string'
      ? message?.created_at
      : message?.created_at?.toISOString?.() ?? '';

  if (!timestamp) return null;

  return (
    <time className={customClass} dateTime={timestamp} title={timestamp}>
      {timestamp}
    </time>
  );
}

export default MessageTimestamp;
