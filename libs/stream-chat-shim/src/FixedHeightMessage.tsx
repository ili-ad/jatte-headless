import React from 'react';
import type { LocalMessage } from 'stream-chat';

export type FixedHeightMessageProps = {
  /** Whether to group messages from the same user */
  groupedByUser?: boolean;
  /** Message data to display */
  message?: LocalMessage;
};

/** Minimal placeholder for Stream's FixedHeightMessage component. */
export const FixedHeightMessage = ({ message }: FixedHeightMessageProps) => {
  return (
    <div data-testid="fixed-height-message">{message?.text}</div>
  );
};

export default FixedHeightMessage;
