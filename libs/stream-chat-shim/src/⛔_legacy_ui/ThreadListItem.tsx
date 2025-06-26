import React, { createContext, useContext } from 'react';
import type { Thread } from 'stream-chat';

export type ThreadListItemProps = {
  thread: Thread;
  threadListItemUIProps?: Record<string, any>;
};

const ThreadListItemContext = createContext<Thread | undefined>(undefined);

export const useThreadListItemContext = () => useContext(ThreadListItemContext);

/** Placeholder implementation of the ThreadListItem component. */
export const ThreadListItem = ({ thread, threadListItemUIProps }: ThreadListItemProps) => {
  return (
    <ThreadListItemContext.Provider value={thread}>
      <div data-testid="thread-list-item-placeholder" {...threadListItemUIProps}>
        ThreadListItem
      </div>
    </ThreadListItemContext.Provider>
  );
};

export default ThreadListItem;
