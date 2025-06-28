import { useEffect } from 'react';
import {
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
} from '../../../context';
import type { Channel, Event, LocalMessage, MessageResponse } from 'chat-shim';

// const hasReadLastMessage = (channel: Channel, userId: string) => {
//   const latestMessageIdInChannel = channel.state.latestMessages.slice(-1)[0]?.id;
//   const lastReadMessageIdServer = channel.state.read[userId]?.last_read_message_id;
//   return latestMessageIdInChannel === lastReadMessageIdServer;
// };


/* ------------------------------------------------------------------ *
 * SAFER helper: tolerate shims that don’t populate `state` up-front  *
 * ------------------------------------------------------------------ */
const hasReadLastMessage = (channel: Channel, userId: string) => {
  // guard: state object may be missing in lightweight shims
  const state: any = channel?.state ?? {};

  // guard: latestMessages may be absent → fall back to empty array
  const latest = (state.latestMessages ?? []) as any[];
  const latestMessageId = latest.slice(-1)[0]?.id;

  // guard: read-map or entry may be absent
  const readMap = state.read ?? {};
  const lastReadMessageIdServer = readMap[userId]?.last_read_message_id;

  return latestMessageId === lastReadMessageIdServer;
};

type UseMarkReadParams = {
  isMessageListScrolledToBottom: boolean;
  messageListIsThread: boolean;
  wasMarkedUnread?: boolean;
};

/**
 * Takes care of marking a channel read. The channel is read only if all the following applies:
 * 1. the message list is not rendered in a thread
 * 2. the message list is scrolled to the bottom
 * 3. the channel was not marked unread by the user
 * @param isMessageListScrolledToBottom
 * @param messageListIsThread
 * @param wasChannelMarkedUnread
 */
export const useMarkRead = ({
  isMessageListScrolledToBottom,
  messageListIsThread,
  wasMarkedUnread,
}: UseMarkReadParams) => {
  const { client } = useChatContext('useMarkRead');
  const { markRead, setChannelUnreadUiState } = useChannelActionContext('useMarkRead');
  const { channel } = useChannelStateContext('useMarkRead');

  useEffect(() => {
    const shouldMarkRead = () =>
      !document.hidden &&
      !wasMarkedUnread &&
      !messageListIsThread &&
      isMessageListScrolledToBottom &&
      client.user?.id &&
      !hasReadLastMessage(channel, client.user.id);

    const onVisibilityChange = () => {
      if (shouldMarkRead()) markRead();
    };

    const handleMessageNew = (event: Event) => {
      const mainChannelUpdated =
        !event.message?.parent_id || event.message?.show_in_channel;

      if (!isMessageListScrolledToBottom || wasMarkedUnread || document.hidden) {
        setChannelUnreadUiState((prev) => {
          const previousUnreadCount = prev?.unread_messages ?? 0;
          const previousLastMessage = getPreviousLastMessage(
            channel.state.messages,
            event.message,
          );
          return {
            ...(prev || {}),
            last_read:
              prev?.last_read ??
              (previousUnreadCount === 0 && previousLastMessage?.created_at
                ? new Date(previousLastMessage.created_at)
                : new Date(0)), // not having information about the last read message means the whole channel is unread,
            unread_messages: previousUnreadCount + 1,
          };
        });
      } else if (mainChannelUpdated && shouldMarkRead()) {
        markRead();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    if (shouldMarkRead()) {
      markRead();
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [
    channel,
    client,
    isMessageListScrolledToBottom,
    markRead,
    messageListIsThread,
    setChannelUnreadUiState,
    wasMarkedUnread,
  ]);
};

function getPreviousLastMessage(messages: LocalMessage[], newMessage?: MessageResponse) {
  if (!newMessage) return;
  let previousLastMessage;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg?.id) break;
    if (msg.id !== newMessage.id) {
      previousLastMessage = msg;
      break;
    }
  }
  return previousLastMessage;
}
