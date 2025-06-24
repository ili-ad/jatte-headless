import React from 'react';
import type { PollOption, PollState } from 'stream-chat';

export type PollResultsProps = {
  /** Poll state representing current poll metadata. */
  poll?: PollState;
  /** List of options belonging to the poll. */
  options?: PollOption[];
};

/** Placeholder implementation of the PollResults component. */
export const PollResults = (_props: PollResultsProps) => (
  <div data-testid="poll-results-placeholder" />
);

export default PollResults;
