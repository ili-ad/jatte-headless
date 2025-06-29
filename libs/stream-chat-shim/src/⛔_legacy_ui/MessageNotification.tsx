import type { PropsWithChildren } from 'react';
import React from 'react';

export type MessageNotificationProps = PropsWithChildren<{
  /** button click event handler */
  onClick: React.MouseEventHandler;
  /** signals whether the message list is considered (below a threshold) to be scrolled to the bottom. Prop used only by [ScrollToBottomButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/ScrollToBottomButton.tsx) */
  isMessageListScrolledToBottom?: boolean;
  /** Whether or not to show notification. Prop used only by [MessageNotification](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/MessageNotification.tsx)  */
  showNotification?: boolean;
  /** informs the component whether it is rendered inside a thread message list */
  threadList?: boolean;
  /** */
  unreadCount?: number;
}>;

/** Minimal placeholder implementation of Stream's `MessageNotification` component. */
export const MessageNotification = (props: MessageNotificationProps) => {
  const { children, onClick, showNotification = true } = props;

  if (!showNotification) return null;

  return (
    <button
      aria-live="polite"
      className="str-chat__message-notification"
      data-testid="message-notification"
      onClick={onClick}
    >
      {children || 'New Messages'}
    </button>
  );
};

export default MessageNotification;
