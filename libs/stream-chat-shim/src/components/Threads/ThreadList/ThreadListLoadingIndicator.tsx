import React from 'react';

// import type { ThreadManagerState } from 'stream-chat'; // TODO backend-wire-up
type ThreadManagerState = any; // temporary shim

import { LoadingIndicator as DefaultLoadingIndicator } from '../../Loading';
// import { useChatContext, useComponentContext } from '../../../context'; // TODO backend-wire-up
const useChatContext = () => ({ client: { threads: { state: {} } } } as any);
const useComponentContext = () => ({ LoadingIndicator: DefaultLoadingIndicator } as any);
// import { useStateStore } from '../../../store'; // TODO backend-wire-up
const useStateStore = (_store: any, selector: any) => selector({ pagination: { isLoadingNext: false } });

const selector = (nextValue: ThreadManagerState) => ({
  isLoadingNext: nextValue.pagination.isLoadingNext,
});

export const ThreadListLoadingIndicator = () => {
  const { LoadingIndicator = DefaultLoadingIndicator } = useComponentContext();
  const { client } = useChatContext();
  const { isLoadingNext } = useStateStore(client.threads.state, selector);

  if (!isLoadingNext) return null;

  return (
    <div className='str-chat__thread-list-loading-indicator'>
      <LoadingIndicator />
    </div>
  );
};

