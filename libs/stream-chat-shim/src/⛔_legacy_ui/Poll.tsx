import React from 'react';
import type { Poll as PollClass } from 'chat-shim';

/**
 * Placeholder implementation of the Stream Chat `Poll` component.
 */
export interface PollProps {
  /** Poll data object from Stream Chat */
  poll: PollClass;
  /** Render a quoted poll if true */
  isQuoted?: boolean;
}

export const Poll: React.FC<PollProps> = ({ isQuoted }) => {
  return (
    <div
      data-testid={isQuoted ? 'quoted-poll-placeholder' : 'poll-placeholder'}
    >
      Poll placeholder
    </div>
  );
};

export default Poll;
