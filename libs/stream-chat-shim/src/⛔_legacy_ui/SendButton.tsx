import React from 'react';
import type { UpdatedMessage } from 'stream-chat';

export type SendButtonProps = {
  sendMessage: (
    event: React.BaseSyntheticEvent,
    customMessageData?: Omit<UpdatedMessage, 'mentioned_users'>,
  ) => void;
} & React.ComponentProps<'button'>;

/**
 * Placeholder implementation of the SendButton component.
 * It renders a basic button invoking the provided sendMessage handler.
 */
export const SendButton = ({ sendMessage, children = 'Send', ...rest }: SendButtonProps) => {
  return (
    <button aria-label="Send" data-testid="send-button" onClick={sendMessage} type="button" {...rest}>
      {children}
    </button>
  );
};

export default SendButton;
