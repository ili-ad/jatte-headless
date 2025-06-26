import React from 'react';
import type { LocalMessage } from 'stream-chat';

export type MessageErrorTextProps = {
  /** The message that failed to send */
  message?: LocalMessage;
};

/** Placeholder component displayed when a message fails to send. */
export const MessageErrorText = (_props: MessageErrorTextProps) => (
  <span data-testid="message-error-text-placeholder">Message failed</span>
);

export default MessageErrorText;
