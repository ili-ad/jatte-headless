import React from 'react';
import type { PollVote as StreamPollVote } from 'stream-chat';

export type PollVoteProps = {
  /** Poll vote data to display */
  vote: StreamPollVote;
};

/**
 * Placeholder component for Stream's PollVote.
 */
export const PollVote = ({ vote }: PollVoteProps) => (
  <div data-testid="poll-vote-placeholder">{vote.option_id ?? vote.id}</div>
);

export default PollVote;
