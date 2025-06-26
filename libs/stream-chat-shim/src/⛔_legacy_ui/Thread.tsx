import React from 'react';
import type { MessageInputProps } from './MessageInput';
import type { MessageListProps } from './MessageList';
import type { MessageProps, MessageUIComponentProps, MessageActionsArray } from './message-types';
import type { VirtualizedMessageListProps } from './VirtualizedMessageList';

export type ThreadProps = {
  /** Additional props for `MessageInput` component. */
  additionalMessageInputProps?: MessageInputProps;
  /** Additional props for `MessageList` component. */
  additionalMessageListProps?: MessageListProps;
  /** Additional props for the parent `Message` component. */
  additionalParentMessageProps?: Partial<MessageProps>;
  /** Additional props for `VirtualizedMessageList` component. */
  additionalVirtualizedMessageListProps?: VirtualizedMessageListProps;
  /** If true, focuses the `MessageInput` component on opening a thread. */
  autoFocus?: boolean;
  /** Inject date separators into the Thread. */
  enableDateSeparator?: boolean;
  /** Custom thread input UI component. */
  Input?: React.ComponentType;
  /** Custom thread message UI component. */
  Message?: React.ComponentType<MessageUIComponentProps>;
  /** Allowed message actions for thread messages. */
  messageActions?: MessageActionsArray;
  /** Use `VirtualizedMessageList` instead of the standard list. */
  virtualized?: boolean;
};

/** Placeholder implementation of the Stream Chat `Thread` component. */
export const Thread = (_props: ThreadProps) => {
  return <div data-testid="thread-placeholder">Thread placeholder</div>;
};

export default Thread;
