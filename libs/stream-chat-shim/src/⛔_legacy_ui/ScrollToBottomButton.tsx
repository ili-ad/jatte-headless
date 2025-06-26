import React from 'react';

export type ScrollToBottomButtonProps = {
  /** signals whether the message list is scrolled to the bottom */
  isMessageListScrolledToBottom?: boolean;
  /** click handler for the button */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** indicator if this is rendered within a thread list */
  threadList?: boolean;
};

/**
 * Placeholder implementation of Stream's ScrollToBottomButton component.
 * It renders a simple button to jump to the latest message when the list is not
 * scrolled to the bottom.
 */
export const ScrollToBottomButton = ({
  isMessageListScrolledToBottom,
  onClick,
}: ScrollToBottomButtonProps) => {
  if (isMessageListScrolledToBottom) return null;

  return (
    <div className="str-chat__jump-to-latest-message">
      <button
        aria-live="polite"
        className="str-chat__message-notification-scroll-to-latest str-chat__circle-fab"
        data-testid="message-notification"
        onClick={onClick}
      >
        Scroll to bottom
      </button>
    </div>
  );
};

export default ScrollToBottomButton;
