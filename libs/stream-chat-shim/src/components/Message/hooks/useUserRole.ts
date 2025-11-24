import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';
import type { LocalMessage } from 'chat-shim';

export const useUserRole = (
  message: LocalMessage,
  onlySenderCanEdit?: boolean,
  disableQuotedMessages?: boolean,
) => {
  const { channel, channelCapabilities = {} } = useChannelStateContext('useUserRole');
  const { client } = useChatContext('useUserRole');

  const membership =
    (channel?.state as { membership?: Record<string, unknown> } | undefined)?.membership ?? {};
  const membershipRole = typeof (membership as { role?: unknown }).role === 'string'
    ? (membership as { role: string }).role
    : undefined;

  /**
   * @deprecated as it relies on `membership.role` check which is already deprecated and shouldn't be used anymore.
   * `isAdmin` will be removed in future release. See `channelCapabilities`.
   */
  const isAdmin = client.user?.role === 'admin' || membershipRole === 'admin';

  /**
   * @deprecated as it relies on `membership.role` check which is already deprecated and shouldn't be used anymore.
   * `isOwner` will be removed in future release. See `channelCapabilities`.
   */
  const isOwner = membershipRole === 'owner';

  /**
   * @deprecated as it relies on `membership.role` check which is already deprecated and shouldn't be used anymore.
   * `isModerator` will be removed in future release. See `channelCapabilities`.
   */
  const isModerator =
    client.user?.role === 'channel_moderator' ||
    membershipRole === 'channel_moderator' ||
    membershipRole === 'moderator' ||
    (membership as { is_moderator?: boolean }).is_moderator === true ||
    (membership as { channel_role?: string }).channel_role === 'channel_moderator';

  const isMyMessage = client.userID === message.user?.id;

  const canEdit =
    !message.poll &&
    ((!onlySenderCanEdit && channelCapabilities['update-any-message']) ||
      (isMyMessage && channelCapabilities['update-own-message']));

  const canDelete =
    channelCapabilities['delete-any-message'] ||
    (isMyMessage && channelCapabilities['delete-own-message']);

  const canFlag = !isMyMessage && channelCapabilities['flag-message'];
  const canMarkUnread = channelCapabilities['read-events'];
  const canMute = !isMyMessage && channelCapabilities['mute-channel'];
  const canQuote = !disableQuotedMessages && channelCapabilities['quote-message'];
  const canReact = channelCapabilities['send-reaction'];
  const canReply = channelCapabilities['send-reply'];

  return {
    canDelete,
    canEdit,
    canFlag,
    canMarkUnread,
    canMute,
    canQuote,
    canReact,
    canReply,
    isAdmin,
    isModerator,
    isMyMessage,
    isOwner,
  };
};
