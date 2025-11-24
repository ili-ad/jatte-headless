import { useMemo } from 'react';

import { isDate, isDayOrMoment } from '../../../i18n';
import { chatAPI } from '../../../api/chatAPI';

import type {
  ChannelStateContextValue,
  TypingUser,
} from '../../../context/ChannelStateContext';

export const useCreateChannelStateContext = (
  value: Omit<ChannelStateContextValue, 'channelCapabilities'> & {
    channelCapabilitiesArray: string[];
    skipMessageDataMemoization?: boolean;
  },
) => {
  const {
    channel,
    channelCapabilitiesArray = [],
    channelConfig,
    channelUnreadUiState,
    error,
    giphyVersion,
    hasMore,
    hasMoreNewer,
    highlightedMessageId,
    imageAttachmentSizeHandler,
    loading,
    loadingMore,
    members,
    messages = [],
    mutes,
    notifications,
    pinnedMessages,
    read = {},
    typing = {},
    shouldGenerateVideoThumbnail,
    skipMessageDataMemoization,
    suppressAutoscroll,
    thread,
    threadHasMore,
    threadLoadingMore,
    threadMessages = [],
    videoAttachmentSizeHandler,
    watcher_count,
    watcherCount,
    watchers,
  } = value;

  const channelId = channel.cid;
  const lastReadDate = channel.initialized ? chatAPI.lastRead({ channel }) : undefined;
  const lastRead = lastReadDate?.getTime();
  const membersLength = Object.keys(members || []).length;
  const notificationsLength = notifications.length;
  const readUsers = Object.values(read);
  const readUsersLength = readUsers.length;
  const readUsersLastReads = readUsers
    .map(({ last_read }) => last_read.toISOString())
    .join();
  const threadMessagesLength = threadMessages?.length;
  const clientUser = channel.getClient();
  const currentUserId = clientUser?.user?.id ?? (clientUser as any)?._user?.id;
  const typingUsers: TypingUser[] = Object.values(typing || {})
    .map(({ parent_id, user }) => ({
      id: user?.id ?? '',
      name: user?.name,
      parent_id,
      role: user?.role,
    }))
    .filter((entry) => entry.id && entry.id !== currentUserId);
  const typingUsersKey = typingUsers.map(({ id, parent_id }) => `${id}:${parent_id ?? ''}`).join();

  const channelCapabilities: Record<string, boolean> = {};

  channelCapabilitiesArray.forEach((capability) => {
    channelCapabilities[capability] = true;
  });

  const memoizedMessageData = skipMessageDataMemoization
    ? messages
    : messages
        .map(
          ({
            deleted_at,
            latest_reactions,
            pinned,
            reply_count,
            status,
            updated_at,
            user,
          }) =>
            `${deleted_at}${
              latest_reactions ? latest_reactions.map(({ type }) => type).join() : ''
            }${pinned}${reply_count}${status}${
              updated_at && (isDayOrMoment(updated_at) || isDate(updated_at))
                ? updated_at.toISOString()
                : updated_at || ''
            }${user?.updated_at}`,
        )
        .join();

  const memoizedThreadMessageData = threadMessages
    .map(
      ({ deleted_at, latest_reactions, pinned, status, updated_at, user }) =>
        `${deleted_at}${
          latest_reactions ? latest_reactions.map(({ type }) => type).join() : ''
        }${pinned}${status}${
          updated_at && (isDayOrMoment(updated_at) || isDate(updated_at))
            ? updated_at.toISOString()
            : updated_at || ''
        }${user?.updated_at}`,
    )
    .join();

  const channelStateContext: ChannelStateContextValue = useMemo(
    () => ({
      channel,
      channelCapabilities,
      channelConfig,
      channelUnreadUiState,
      error,
      giphyVersion,
      hasMore,
      hasMoreNewer,
      highlightedMessageId,
      imageAttachmentSizeHandler,
      loading,
      loadingMore,
      members,
      messages,
      mutes,
      notifications,
      pinnedMessages,
      read,
      typing,
      typingUsers,
      shouldGenerateVideoThumbnail,
      suppressAutoscroll,
      thread,
      threadHasMore,
      threadLoadingMore,
      threadMessages,
      videoAttachmentSizeHandler,
      watcher_count,
      watcherCount,
      watchers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channel.data?.name, // otherwise ChannelHeader will not be updated
      channelId,
      channelUnreadUiState,
      error,
      hasMore,
      hasMoreNewer,
      highlightedMessageId,
      lastRead,
      loading,
      loadingMore,
      membersLength,
      memoizedMessageData,
      memoizedThreadMessageData,
      notificationsLength,
      readUsersLength,
      readUsersLastReads,
      shouldGenerateVideoThumbnail,
      skipMessageDataMemoization,
      suppressAutoscroll,
      thread,
      threadHasMore,
      threadLoadingMore,
      threadMessagesLength,
      typingUsersKey,
      watcherCount,
    ],
  );

  return channelStateContext;
};
