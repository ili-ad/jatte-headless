import React from 'react';

export type MessageDeletedProps = {
  /** The message object that was deleted */
  message: any;
};

/** Placeholder implementation of MessageDeleted component */
export const MessageDeleted = ({ message }: MessageDeletedProps) => {
  return (
    <div
      className="str-chat__message str-chat__message--deleted"
      data-testid="message-deleted-component"
      key={message?.id}
    >
      <div className="str-chat__message--deleted-inner">This message was deleted...</div>
    </div>
  );
};

export default MessageDeleted;
