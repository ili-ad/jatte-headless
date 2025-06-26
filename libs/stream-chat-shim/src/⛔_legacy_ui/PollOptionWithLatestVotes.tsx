import React from 'react';
import type { PollOption } from 'stream-chat';

export type PollOptionWithVotesProps = {
  option: PollOption;
  countVotesPreview?: number;
  showAllVotes?: () => void;
};

export const PollOptionWithLatestVotes = (_props: PollOptionWithVotesProps) => {
  throw new Error('PollOptionWithLatestVotes shim not implemented');
};
