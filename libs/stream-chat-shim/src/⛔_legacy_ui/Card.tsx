import React from 'react';
import type { Attachment } from 'stream-chat';

export type CardProps = Attachment;

/**
 * Placeholder component for Stream Chat's Card attachment.
 * TODO: provide real implementation.
 */
export const Card: React.FC<CardProps> = () => {
  return (
    <div className="str-chat__message-attachment-card">
      Card component not implemented
    </div>
  );
};
