import React, { type RefObject } from 'react';
import type { ScrollSeekConfiguration, ScrollSeekPlaceholderProps, VirtuosoHandle, VirtuosoProps } from 'react-virtuoso';
import type { LocalMessage, UserResponse } from 'stream-chat';

// Placeholder type definitions mirroring the Stream Chat React library
export type GroupStyle = any;
export type ProcessMessagesParams = { reviewProcessedMessage?: (...args: any[]) => any };
export type RenderedMessage = any;
export type MessageProps = any;
export type MessageUIComponentProps = any;
export type ChannelActionContextValue = any;
export type ChannelStateContextValue = { channelUnreadUiState?: any };
export type ChatContextValue = { customClasses?: Record<string, string> };
export type ComponentContextValue = {
  DateSeparator?: React.ComponentType<any>;
  MessageSystem?: React.ComponentType<any>;
  UnreadMessagesSeparator?: React.ComponentType<any>;
  Message?: React.ComponentType<any>;
};
export type UnknownType = any;

// Utility types from the original library
 type PropsDrilledToMessage =
  | 'additionalMessageInputProps'
  | 'customMessageActions'
  | 'formatDate'
  | 'messageActions'
  | 'openThread'
  | 'reactionDetailsSort'
  | 'sortReactions'
  | 'sortReactionDetails';

 type VirtualizedMessageListPropsForContext =
  | PropsDrilledToMessage
  | 'closeReactionSelectorOnClick'
  | 'customMessageRenderer'
  | 'head'
  | 'loadingMore'
  | 'Message'
  | 'shouldGroupByUser'
  | 'threadList';

/** Context object provided to some Virtuoso callbacks */
export type VirtuosoContext = Required<
  Pick<ComponentContextValue, 'DateSeparator' | 'MessageSystem' | 'UnreadMessagesSeparator'>
> &
  Pick<VirtualizedMessageListProps, VirtualizedMessageListPropsForContext> &
  Pick<ChatContextValue, 'customClasses'> & {
    lastReceivedMessageId: string | null | undefined;
    messageGroupStyles: Record<string, GroupStyle>;
    numItemsPrepended: number;
    ownMessagesReadByOthers: Record<string, UserResponse[]>;
    processedMessages: RenderedMessage[];
    virtuosoRef: RefObject<VirtuosoHandle | null>;
    firstUnreadMessageId?: string;
    lastReadDate?: Date;
    lastReadMessageId?: string;
    unreadMessageCount?: number;
  };

export type VirtualizedMessageListProps = Partial<Pick<MessageProps, PropsDrilledToMessage>> & {
  additionalVirtuosoProps?: VirtuosoProps<UnknownType, VirtuosoContext>;
  channelUnreadUiState?: ChannelStateContextValue['channelUnreadUiState'];
  closeReactionSelectorOnClick?: boolean;
  customMessageRenderer?: (messageList: RenderedMessage[], index: number) => React.ReactElement;
  defaultItemHeight?: number;
  disableDateSeparator?: boolean;
  groupStyles?: (
    message: RenderedMessage,
    previousMessage: RenderedMessage,
    nextMessage: RenderedMessage,
    noGroupByUser: boolean,
    maxTimeBetweenGroupedMessages?: number,
  ) => GroupStyle;
  hasMore?: boolean;
  hasMoreNewer?: boolean;
  head?: React.ReactElement;
  hideDeletedMessages?: boolean;
  hideNewMessageSeparator?: boolean;
  highlightedMessageId?: string;
  loadingMore?: boolean;
  loadingMoreNewer?: boolean;
  loadMore?: ChannelActionContextValue['loadMore'] | (() => Promise<void>);
  loadMoreNewer?: ChannelActionContextValue['loadMore'] | (() => Promise<void>);
  maxTimeBetweenGroupedMessages?: number;
  Message?: React.ComponentType<MessageUIComponentProps>;
  messageLimit?: number;
  messages?: LocalMessage[];
  overscan?: number;
  returnAllReadData?: boolean;
  reviewProcessedMessage?: ProcessMessagesParams['reviewProcessedMessage'];
  scrollSeekPlaceHolder?: ScrollSeekConfiguration & {
    placeholder: React.ComponentType<ScrollSeekPlaceholderProps>;
  };
  scrollToLatestMessageOnFocus?: boolean;
  separateGiphyPreview?: boolean;
  shouldGroupByUser?: boolean;
  showUnreadNotificationAlways?: boolean;
  stickToBottomScrollBehavior?: 'smooth' | 'auto';
  suppressAutoscroll?: boolean;
  threadList?: boolean;
};

/** Placeholder implementation of VirtualizedMessageList */
export function VirtualizedMessageList(_props: VirtualizedMessageListProps) {
  return (
    <div data-testid="virtualized-message-list">VirtualizedMessageList placeholder</div>
  );
}

export default VirtualizedMessageList;
