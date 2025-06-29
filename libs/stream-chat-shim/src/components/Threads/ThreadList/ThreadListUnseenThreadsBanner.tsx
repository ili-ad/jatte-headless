import React from 'react';

import type { ThreadManagerState } from 'chat-shim';

import { Icon } from '../icons';
import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import { clientThreadsState } from '../../../chatSDKShim';

const selector = (nextValue: ThreadManagerState) => ({
  unseenThreadIds: nextValue.unseenThreadIds,
});

export const ThreadListUnseenThreadsBanner = () => {
  const { client } = useChatContext();
  const { unseenThreadIds } = useStateStore(
    clientThreadsState(client),
    selector,
  );

  if (!unseenThreadIds.length) return null;

  return (
    <div className='str-chat__unseen-threads-banner'>
      {/* TODO: translate */}
      {unseenThreadIds.length} unread threads
      <button
        className='str-chat__unseen-threads-banner__button'
        onClick={() => {
          client.threads.reload();
        }}
      >
        <Icon.Reload />
      </button>
    </div>
  );
};
