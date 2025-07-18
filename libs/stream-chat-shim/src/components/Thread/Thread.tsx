import React, { useEffect } from 'react';
import clsx from 'clsx';

import { LegacyThreadContext } from './LegacyThreadContext';
import { MESSAGE_ACTIONS } from '../Message';
import type { MessageInputProps } from '../MessageInput';
import { MessageInput, MessageInputFlat } from '../MessageInput';
import type { MessageListProps, VirtualizedMessageListProps } from '../MessageList';
import { MessageList, VirtualizedMessageList } from '../MessageList';
import { ThreadHeader as DefaultThreadHeader } from './ThreadHeader';
import { ThreadHead as DefaultThreadHead } from '../Thread/ThreadHead';

import {
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useComponentContext,
} from '../../context';
import { useThreadContext } from '../Threads';
import { useStateStore } from '../../store';

import type { MessageProps, MessageUIComponentProps } from '../Message/types';
import type { MessageActionsArray } from '../Message/utils';
import type { ThreadState } from 'chat-shim';

export type ThreadProps = {
  /** Additional props for `MessageInput` component: [available props](https://getstream.io/chat/docs/sdk/react/message-input-components/message_input/#props) */
  additionalMessageInputProps?: MessageInputProps;
  /** Additional props for `MessageList` component: [available props](https://getstream.io/chat/docs/sdk/react/core-components/message_list/#props) */
  additionalMessageListProps?: MessageListProps;
  /** Additional props for `Message` component of the parent message: [available props](https://getstream.io/chat/docs/sdk/react/message-components/message/#props) */
  additionalParentMessageProps?: Partial<MessageProps>;
  /** Additional props for `VirtualizedMessageList` component: [available props](https://getstream.io/chat/docs/sdk/react/core-components/virtualized_list/#props) */
  additionalVirtualizedMessageListProps?: VirtualizedMessageListProps;
  /** If true, focuses the `MessageInput` component on opening a thread */
  autoFocus?: boolean;
  /** Injects date separator components into `Thread`, defaults to `false`. To be passed to the underlying `MessageList` or `VirtualizedMessageList` components */
  enableDateSeparator?: boolean;
  /** Custom thread input UI component used to override the default `Input` value stored in `ComponentContext` or the [MessageInputSmall](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/MessageInputSmall.tsx) default */
  Input?: React.ComponentType;
  /** Custom thread message UI component used to override the default `Message` value stored in `ComponentContext` */
  Message?: React.ComponentType<MessageUIComponentProps>;
  /** Array of allowed message actions (ex: ['edit', 'delete', 'flag', 'mute', 'pin', 'quote', 'react', 'reply']). To disable all actions, provide an empty array. */
  messageActions?: MessageActionsArray;
  /** If true, render the `VirtualizedMessageList` instead of the standard `MessageList` component */
  virtualized?: boolean;
};

/**
 * The Thread component renders a parent Message with a list of replies
 */
export const Thread = (props: ThreadProps) => {
  const { channel, channelConfig, thread } = useChannelStateContext('Thread');
  const threadInstance = useThreadContext();

  if (!thread && !threadInstance) return null;
  if (channelConfig?.replies === false) return null;

  // the wrapper ensures a key variable is set and the component recreates on thread switch
  return (
    // FIXME: TS is having trouble here as at least one of the two would always be defined
    <ThreadInner
      {...props}
      key={`thread-${(thread ?? threadInstance)?.id}-${channel?.cid}`}
    />
  );
};

const selector = (nextValue: ThreadState) => ({
  isLoadingNext: nextValue.pagination.isLoadingNext,
  isLoadingPrev: nextValue.pagination.isLoadingPrev,
  parentMessage: nextValue.parentMessage,
  replies: nextValue.replies,
});

const ThreadInner = (props: ThreadProps & { key: string }) => {
  const {
    additionalMessageInputProps,
    additionalMessageListProps,
    additionalParentMessageProps,
    additionalVirtualizedMessageListProps,
    autoFocus = true,
    enableDateSeparator = false,
    Input: PropInput,
    Message: PropMessage,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    virtualized,
  } = props;

  const threadInstance = useThreadContext();

  const {
    thread,
    threadHasMore,
    threadLoadingMore,
    threadMessages = [],
    threadSuppressAutoscroll,
  } = useChannelStateContext('Thread');
  const { closeThread, loadMoreThread } = useChannelActionContext('Thread');
  const { customClasses } = useChatContext('Thread');
  const {
    Message: ContextMessage,
    ThreadHead = DefaultThreadHead,
    ThreadHeader = DefaultThreadHeader,
    ThreadInput: ContextInput,
    VirtualMessage,
  } = useComponentContext('Thread');

  const { isLoadingNext, isLoadingPrev, parentMessage, replies } =
    useStateStore(threadInstance?.state, selector) ?? {};

  const ThreadInput =
    PropInput ?? additionalMessageInputProps?.Input ?? ContextInput ?? MessageInputFlat;

  const ThreadMessage = PropMessage || additionalMessageListProps?.Message;
  const FallbackMessage = virtualized && VirtualMessage ? VirtualMessage : ContextMessage;
  const MessageUIComponent = ThreadMessage || FallbackMessage;

  const ThreadMessageList = virtualized ? VirtualizedMessageList : MessageList;

  useEffect(() => {
    if (threadInstance) return;

    if ((thread?.reply_count ?? 0) > 0) {
      // FIXME: integrators can customize channel query options but cannot customize channel.getReplies() options
      loadMoreThread();
    }
  }, [thread, loadMoreThread, threadInstance]);

  const threadProps: Pick<
    VirtualizedMessageListProps,
    | 'hasMoreNewer'
    | 'loadMoreNewer'
    | 'loadingMoreNewer'
    | 'hasMore'
    | 'loadMore'
    | 'loadingMore'
    | 'messages'
  > = threadInstance
    ? {
        loadingMore: isLoadingPrev,
        loadingMoreNewer: isLoadingNext,
        loadMore: threadInstance.loadPrevPage,
        loadMoreNewer: threadInstance.loadNextPage,
        messages: replies,
      }
    : {
        hasMore: threadHasMore,
        loadingMore: threadLoadingMore,
        loadMore: loadMoreThread,
        messages: threadMessages,
      };

  const messageAsThread = thread ?? parentMessage;

  if (!messageAsThread) return null;

  const threadClass =
    customClasses?.thread ||
    clsx('str-chat__thread-container str-chat__thread', {
      'str-chat__thread--virtualized': virtualized,
    });

  const head = (
    <ThreadHead
      key={messageAsThread.id}
      message={messageAsThread}
      Message={MessageUIComponent}
      {...additionalParentMessageProps}
    />
  );

  return (
    // Thread component needs a context which we can use for message composer
    <LegacyThreadContext.Provider
      value={{
        legacyThread: thread ?? undefined,
      }}
    >
      <div className={threadClass}>
        <ThreadHeader closeThread={closeThread} thread={messageAsThread} />
        <ThreadMessageList
          disableDateSeparator={!enableDateSeparator}
          head={head}
          Message={MessageUIComponent}
          messageActions={messageActions}
          suppressAutoscroll={threadSuppressAutoscroll}
          threadList
          {...threadProps}
          {...(virtualized
            ? additionalVirtualizedMessageListProps
            : additionalMessageListProps)}
        />
        <MessageInput
          focus={autoFocus}
          Input={ThreadInput}
          isThreadInput
          parent={thread ?? parentMessage}
          {...additionalMessageInputProps}
        />
      </div>
    </LegacyThreadContext.Provider>
  );
};
