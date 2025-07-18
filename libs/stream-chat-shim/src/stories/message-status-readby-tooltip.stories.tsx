import React, { useCallback } from 'react';
import type { ChannelSort } from 'chat-shim';

import {
  Channel,
  ChannelHeader,
  ChannelList,
  MessageList,
  MessageStatus,
  Thread,
  Window,
} from '../index';
import { ConnectedUser } from './utils';
import type { ConnectedUserProps } from './utils';
import type { MessageStatusProps, TooltipUsernameMapper } from '../index';

const channelId = import.meta.env.E2E_ADD_MESSAGE_CHANNEL;
if (!channelId || typeof channelId !== 'string') {
  throw new Error('expected ADD_MESSAGE_CHANNEL');
}

const CustomMessageStatus = (props: MessageStatusProps) => {
  const allCapsUserName = useCallback<TooltipUsernameMapper>(
    (user) => (user.name || user.id).toUpperCase(),
    [],
  );
  return <MessageStatus {...props} tooltipUserNameMapper={allCapsUserName} />;
};

// Sort in reverse order to avoid auto-selecting unread channel
const sort: ChannelSort = { last_updated: 1 };
const WrappedConnectedUser = ({
  token,
  userId,
}: Omit<ConnectedUserProps, 'children'>) => (
  <ConnectedUser token={token} userId={userId}>
    <ChannelList
      filters={{ id: { $eq: 'add-message' }, members: { $in: [userId] } }}
      sort={sort}
    />
    <Channel MessageStatus={CustomMessageStatus}>
      <Window>
        <ChannelHeader />
        <MessageList />
      </Window>
      <Thread />
    </Channel>
  </ConnectedUser>
);

export const User1 = () => {
  const userId = import.meta.env.E2E_TEST_USER_1;
  const token = import.meta.env.E2E_TEST_USER_1_TOKEN;
  if (!userId || typeof userId !== 'string') {
    throw new Error('expected TEST_USER_1');
  }
  if (!token || typeof token !== 'string') {
    throw new Error('expected TEST_USER_1_TOKEN');
  }
  return <WrappedConnectedUser token={token} userId={userId} />;
};

export const User2 = () => {
  const userId = import.meta.env.E2E_TEST_USER_2;
  const token = import.meta.env.E2E_TEST_USER_2_TOKEN;
  if (!userId || typeof userId !== 'string') {
    throw new Error('expected TEST_USER_2');
  }
  if (!token || typeof token !== 'string') {
    throw new Error('expected TEST_USER_2_TOKEN');
  }
  return <WrappedConnectedUser token={token} userId={userId} />;
};
