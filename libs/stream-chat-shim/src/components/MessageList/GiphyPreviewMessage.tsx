import React from 'react';
import type { LocalMessage } from 'stream-chat';

import { Message } from '../Message/Message';
type LocalMessage = any;

export type GiphyPreviewMessageProps = {
  message: LocalMessage;
};

export const GiphyPreviewMessage = (props: GiphyPreviewMessageProps) => {
  const { message } = props;

  return (
    <div className='giphy-preview-message'>
      <Message message={message} />
    </div>
  );
};
