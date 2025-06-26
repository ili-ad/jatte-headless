import React from 'react';

/** Props for the PollActions component.
 * These match the public interface from stream-chat-react but do not yet
 * provide detailed typings.
 */
export type PollActionsProps = {
  AddCommentForm?: React.ComponentType<any>;
  EndPollDialog?: React.ComponentType<any>;
  PollAnswerList?: React.ComponentType<any>;
  PollOptionsFullList?: React.ComponentType<any>;
  PollResults?: React.ComponentType<any>;
  SuggestPollOptionForm?: React.ComponentType<any>;
};

/** Placeholder implementation of Stream's PollActions component. */
export const PollActions = (_props: PollActionsProps) => {
  return <div className="str-chat__poll-actions">PollActions</div>;
};

export default PollActions;
