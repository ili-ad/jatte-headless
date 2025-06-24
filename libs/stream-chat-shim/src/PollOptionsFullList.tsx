// libs/stream-chat-shim/src/PollOptionsFullList.tsx
import React from 'react';
import type { PollState } from 'stream-chat';

export type FullPollOptionsListingProps = {
  /** Callback fired when the modal should be closed */
  close?: () => void;
};

/**
 * Placeholder component for Stream's PollOptionsFullList.
 * Renders a simple container for poll options.
 */
export const PollOptionsFullList = (_props: FullPollOptionsListingProps) => {
  return <div className="str-chat__poll-options-full-list">Poll options placeholder</div>;
};

export default PollOptionsFullList;
