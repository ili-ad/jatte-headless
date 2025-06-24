import React from 'react';
import type { LocalMessage } from 'stream-chat';
import type { MessageProps } from './message-types';

// Prop names forwarded from MessageList to the underlying Message component
// in the real Stream Chat implementation.
type PropsDrilledToMessage =
  | 'additionalMessageInputProps'
  | 'closeReactionSelectorOnClick'
  | 'customMessageActions'
  | 'disableQuotedMessages'
  | 'formatDate'
  | 'getDeleteMessageErrorNotification'
  | 'getFlagMessageErrorNotification'
  | 'getFlagMessageSuccessNotification'
  | 'getMarkMessageUnreadErrorNotification'
  | 'getMarkMessageUnreadSuccessNotification'
  | 'getMuteUserErrorNotification'
  | 'getMuteUserSuccessNotification'
  | 'getPinMessageErrorNotification'
  | 'Message'
  | 'messageActions'
  | 'onlySenderCanEdit'
  | 'onMentionsClick'
  | 'onMentionsHover'
  | 'onUserClick'
  | 'onUserHover'
  | 'openThread'
  | 'pinPermissions'
  | 'reactionDetailsSort'
  | 'renderText'
  | 'retrySendMessage'
  | 'sortReactions'
  | 'sortReactionDetails'
  | 'unsafeHTML';

// Placeholder type aliases for complex Stream Chat structures
// These will be replaced with real types once migrated.
type RenderedMessage = any;
type GroupStyle = any;
type MessageRenderer = (...args: any[]) => React.ReactNode;
interface ProcessMessagesParams {
  reviewProcessedMessage?: (...args: any[]) => any;
}

export type MessageListProps =
  Partial<Pick<MessageProps, PropsDrilledToMessage>> & {
    disableDateSeparator?: boolean;
    groupStyles?: (
      message: RenderedMessage,
      previousMessage: RenderedMessage,
      nextMessage: RenderedMessage,
      noGroupByUser: boolean,
      maxTimeBetweenGroupedMessages?: number,
    ) => GroupStyle;
    hasMore?: boolean;
    head?: React.ReactElement;
    headerPosition?: number;
    hideDeletedMessages?: boolean;
    hideNewMessageSeparator?: boolean;
    internalInfiniteScrollProps?: Partial<any>;
    jumpToLatestMessage?: () => Promise<void>;
    loadingMore?: boolean;
    loadingMoreNewer?: boolean;
    loadMore?: (() => Promise<void>) | any;
    loadMoreNewer?: (() => Promise<void>) | any;
    maxTimeBetweenGroupedMessages?: number;
    messageLimit?: number;
    messages?: LocalMessage[];
    noGroupByUser?: boolean;
    renderMessages?: MessageRenderer;
    returnAllReadData?: boolean;
    reviewProcessedMessage?: ProcessMessagesParams['reviewProcessedMessage'];
    scrolledUpThreshold?: number;
    showUnreadNotificationAlways?: boolean;
    threadList?: boolean;
  };

/** Placeholder implementation of the MessageList component. */
export const MessageList = (_props: MessageListProps) => {
  return (
    <div data-testid="message-list-placeholder">MessageList placeholder</div>
  );
};

export default MessageList;
