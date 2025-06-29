import React from 'react';

import type { ThreadManagerState } from 'chat-shim';

import { LoadingIndicator as DefaultLoadingIndicator } from '../../Loading';
import { useChatContext, useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';
import { clientThreadsState } from '../../../chatSDKShim';

const selector = (nextValue: ThreadManagerState) => ({
  isLoadingNext: nextValue.pagination.isLoadingNext,
});

export const ThreadListLoadingIndicator = () => {
  const { LoadingIndicator = DefaultLoadingIndicator } = useComponentContext();
  const { client } = useChatContext();
  const { isLoadingNext } = useStateStore(
    clientThreadsState(client),
    selector,
  );

  if (!isLoadingNext) return null;

  return (
    <div className='str-chat__thread-list-loading-indicator'>
      <LoadingIndicator />
    </div>
  );
};
