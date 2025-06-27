import React from 'react';
import type { PollAnswer, PollState } from 'chat-shim';

export type PollAnswerListProps = {
  /** The poll containing answers. */
  poll?: PollState;
  /** List of poll answers to display. */
  answers?: PollAnswer[];
};

/** Placeholder implementation of PollAnswerList component. */
export const PollAnswerList = (_props: PollAnswerListProps) => {
  return <div data-testid="poll-answer-list">PollAnswerList placeholder</div>;
};

export default PollAnswerList;
