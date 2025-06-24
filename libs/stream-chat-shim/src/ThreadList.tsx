import React, { useEffect } from 'react';
import type { VirtuosoProps } from 'react-virtuoso';
import type { Thread } from 'stream-chat';

export type ThreadListProps = {
  virtuosoProps?: VirtuosoProps<Thread, unknown>;
};

/** Placeholder for Stream's `useThreadList` hook. */
export const useThreadList = () => {
  // In the real implementation this hook manages thread list activation
  // and visibility based on the document state.
  useEffect(() => {}, []);
};

/** Minimal placeholder for Stream's `ThreadList` component. */
export const ThreadList = (_props: ThreadListProps) => {
  return <div data-testid="thread-list-placeholder">ThreadList placeholder</div>;
};

export default ThreadList;
