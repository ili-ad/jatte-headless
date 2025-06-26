import React from 'react';
import type { LocalMessage } from 'stream-chat';

export interface ThreadHeaderProps {
  /** Callback for closing the thread */
  closeThread: (event?: React.BaseSyntheticEvent) => void;
  /** The thread parent message */
  thread: LocalMessage;
  /** Optional override for the channel image */
  overrideImage?: any;
  /** Optional override for the channel title */
  overrideTitle?: any;
}

/** Placeholder implementation of Stream's ThreadHeader component. */
export const ThreadHeader = (_props: ThreadHeaderProps) => {
  return <div data-testid="thread-header-placeholder">ThreadHeader</div>;
};

export default ThreadHeader;
