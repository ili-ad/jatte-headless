import React from 'react';

/**
 * Very-light placeholder for Stream’s `<Channel>` component.
 * (Just renders its children until a fuller implementation lands.)
 */
export interface ChannelProps {
  /** Channel instance from the chat client (optional, not used yet) */
  channel?: any;
  /** React children to render inside the channel */
  children?: React.ReactNode;
}

export const Channel: React.FC<ChannelProps> = ({ children }) => (
  <div data-testid="channel">{children}</div>
);

export default Channel;
