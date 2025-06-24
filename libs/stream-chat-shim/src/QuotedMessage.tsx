import React from 'react';

export type QuotedMessageProps = {
  /**
   * Function to render the text content of the quoted message.
   */
  renderText?: (...args: any[]) => React.ReactNode;
};

/**
 * Placeholder implementation of Stream's `QuotedMessage` component.
 */
export const QuotedMessage = (_props: QuotedMessageProps) => {
  return <div data-testid="quoted-message-placeholder" />;
};

export default QuotedMessage;
