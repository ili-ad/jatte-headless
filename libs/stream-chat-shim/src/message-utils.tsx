// libs/stream-chat-shim/src/message-utils.tsx

import type { TFunction } from 'i18next';
import type {
  ChannelConfigWithInfo,
  LocalMessage,
  LocalMessageBase,
  MessageResponse,
  Mute,
  StreamChat,
  UserResponse,
} from 'stream-chat';

// Placeholder types for compatibility with the UI. These should be
// replaced with the real definitions once the full code is migrated.
export type PinPermissions = Record<string, Record<string, boolean>>;
export type MessageProps = any;
export type ComponentContextValue = any;
export type CustomMessageActions = any;
export type MessageContextValue = any;

export const validateAndGetMessage = <T extends unknown[]>(
  func: (...args: T) => unknown,
  args: T,
) => {
  if (typeof func !== 'function') return null;
  if (!Array.isArray(args)) args = [args] as unknown as T;
  const out = func(...args);
  return typeof out === 'string' ? out : null;
};

export const isUserMuted = (message: LocalMessage, mutes?: Mute[]) => {
  if (!mutes || !message) return false;
  return mutes.some((m) => m.target.id === message.user?.id);
};

export const MESSAGE_ACTIONS = {
  delete: 'delete',
  edit: 'edit',
  flag: 'flag',
  markUnread: 'markUnread',
  mute: 'mute',
  pin: 'pin',
  quote: 'quote',
  react: 'react',
  remindMe: 'remindMe',
  reply: 'reply',
  saveForLater: 'saveForLater',
} as const;

export type MessageActionsArray<T extends string = string> = Array<
  keyof typeof MESSAGE_ACTIONS | T
>;

export const defaultPinPermissions: PinPermissions = {
  commerce: {
    admin: true,
    anonymous: false,
    channel_member: false,
    channel_moderator: true,
    guest: false,
    member: false,
    moderator: true,
    owner: true,
    user: false,
  },
  gaming: {
    admin: true,
    anonymous: false,
    channel_member: false,
    channel_moderator: true,
    guest: false,
    member: false,
    moderator: true,
    owner: false,
    user: false,
  },
  livestream: {
    admin: true,
    anonymous: false,
    channel_member: false,
    channel_moderator: true,
    guest: false,
    member: false,
    moderator: true,
    owner: true,
    user: false,
  },
  messaging: {
    admin: true,
    anonymous: false,
    channel_member: true,
    channel_moderator: true,
    guest: false,
    member: true,
    moderator: true,
    owner: true,
    user: false,
  },
  team: {
    admin: true,
    anonymous: false,
    channel_member: true,
    channel_moderator: true,
    guest: false,
    member: true,
    moderator: true,
    owner: true,
    user: false,
  },
};

export type Capabilities = {
  canDelete?: boolean;
  canEdit?: boolean;
  canFlag?: boolean;
  canMarkUnread?: boolean;
  canMute?: boolean;
  canPin?: boolean;
  canQuote?: boolean;
  canReact?: boolean;
  canReply?: boolean;
};

export const getMessageActions = (
  actions: MessageActionsArray | boolean,
  {
    canDelete,
    canEdit,
    canFlag,
    canMarkUnread,
    canMute,
    canPin,
    canQuote,
    canReact,
    canReply,
  }: Capabilities,
  channelConfig?: ChannelConfigWithInfo,
): MessageActionsArray => {
  const out: MessageActionsArray = [];
  let list: MessageActionsArray = [];

  if (actions && typeof actions === 'boolean') {
    list = Object.keys(MESSAGE_ACTIONS) as MessageActionsArray;
  } else if (actions && actions.length > 0) {
    list = [...actions];
  } else {
    return [];
  }

  if (canDelete && list.includes(MESSAGE_ACTIONS.delete)) out.push(MESSAGE_ACTIONS.delete);
  if (canEdit && list.includes(MESSAGE_ACTIONS.edit)) out.push(MESSAGE_ACTIONS.edit);
  if (canFlag && list.includes(MESSAGE_ACTIONS.flag)) out.push(MESSAGE_ACTIONS.flag);
  if (canMarkUnread && list.includes(MESSAGE_ACTIONS.markUnread)) out.push(MESSAGE_ACTIONS.markUnread);
  if (canMute && list.includes(MESSAGE_ACTIONS.mute)) out.push(MESSAGE_ACTIONS.mute);
  if (canPin && list.includes(MESSAGE_ACTIONS.pin)) out.push(MESSAGE_ACTIONS.pin);
  if (canQuote && list.includes(MESSAGE_ACTIONS.quote)) out.push(MESSAGE_ACTIONS.quote);
  if (canReact && list.includes(MESSAGE_ACTIONS.react)) out.push(MESSAGE_ACTIONS.react);
  if (channelConfig?.['user_message_reminders'] && list.includes(MESSAGE_ACTIONS.remindMe)) out.push(MESSAGE_ACTIONS.remindMe);
  if (canReply && list.includes(MESSAGE_ACTIONS.reply)) out.push(MESSAGE_ACTIONS.reply);
  if (channelConfig?.['user_message_reminders'] && list.includes(MESSAGE_ACTIONS.saveForLater)) out.push(MESSAGE_ACTIONS.saveForLater);

  return out;
};

export const ACTIONS_NOT_WORKING_IN_THREAD = [
  MESSAGE_ACTIONS.pin,
  MESSAGE_ACTIONS.reply,
  MESSAGE_ACTIONS.markUnread,
];

export const showMessageActionsBox = (
  actions: MessageActionsArray,
  inThread?: boolean,
) => shouldRenderMessageActions({ inThread, messageActions: actions });

export const shouldRenderMessageActions = ({
  customMessageActions,
  CustomMessageActionsList,
  inThread,
  messageActions,
}: {
  messageActions: MessageActionsArray;
  customMessageActions?: CustomMessageActions;
  CustomMessageActionsList?: ComponentContextValue['CustomMessageActionsList'];
  inThread?: boolean;
}) => {
  if (typeof CustomMessageActionsList !== 'undefined' || typeof customMessageActions !== 'undefined') {
    return true;
  }
  if (!messageActions.length) return false;
  if (
    inThread &&
    messageActions.filter((a) => !ACTIONS_NOT_WORKING_IN_THREAD.includes(a)).length === 0
  ) {
    return false;
  }
  if (
    messageActions.length === 1 &&
    (messageActions.includes(MESSAGE_ACTIONS.react) || messageActions.includes(MESSAGE_ACTIONS.reply))
  ) {
    return false;
  }
  if (
    messageActions.length === 2 &&
    messageActions.includes(MESSAGE_ACTIONS.react) &&
    messageActions.includes(MESSAGE_ACTIONS.reply)
  ) {
    return false;
  }
  return true;
};

export const areMessagePropsEqual = (
  _prevProps: MessageProps & { mutes?: Mute[]; showDetailedReactions?: boolean },
  _nextProps: MessageProps & { mutes?: Mute[]; showDetailedReactions?: boolean },
) => false;

export const areMessageUIPropsEqual = (
  _prevProps: MessageContextValue & { showDetailedReactions?: boolean },
  _nextProps: MessageContextValue & { showDetailedReactions?: boolean },
) => false;

export const messageHasReactions = (message?: LocalMessage) =>
  Object.values(message?.reaction_groups ?? {}).some(({ count }) => count > 0);

export const messageHasAttachments = (message?: LocalMessage) =>
  !!message?.attachments && message.attachments.length > 0;

export const getImages = (message?: MessageResponse) => {
  if (!message?.attachments) return [] as any[];
  return message.attachments.filter((item) => item.type === 'image');
};

export const getNonImageAttachments = (message?: MessageResponse) => {
  if (!message?.attachments) return [] as any[];
  return message.attachments.filter((item) => item.type !== 'image');
};

export interface TooltipUsernameMapper {
  (user: UserResponse): string;
}

export const mapToUserNameOrId: TooltipUsernameMapper = (user) => user.name || user.id;

export const getReadByTooltipText = (
  users: UserResponse[],
  t: TFunction,
  client: StreamChat,
  tooltipUserNameMapper: TooltipUsernameMapper,
) => {
  const others = users
    .filter((u) => u && client?.user && u.id !== client.user.id)
    .map(tooltipUserNameMapper);
  return others.join(', ');
};

const emojiPattern = /[\p{Emoji_Presentation}\uFE0F]/u;
export const isOnlyEmojis = (text?: string) => {
  if (!text) return false;
  const noEmojis = text.replace(emojiPattern, '');
  const noSpace = noEmojis.replace(/[\s\n]/gm, '');
  return noSpace.length === 0;
};

export const isMessageBounced = (
  message: Pick<LocalMessage, 'type' | 'moderation' | 'moderation_details'>,
) =>
  message.type === 'error' &&
  (message.moderation_details?.action === 'MESSAGE_RESPONSE_ACTION_BOUNCE' ||
    (message as any).moderation?.action === 'bounce');

export const isMessageBlocked = (
  message: Pick<LocalMessage, 'type' | 'moderation' | 'moderation_details'>,
) =>
  message.type === 'error' &&
  (message.moderation_details?.action === 'MESSAGE_RESPONSE_ACTION_REMOVE' ||
    (message as any).moderation?.action === 'remove');

export const isMessageEdited = (message: Pick<LocalMessage, 'message_text_updated_at'>) =>
  !!message.message_text_updated_at;

