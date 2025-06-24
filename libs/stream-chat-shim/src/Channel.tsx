import React from 'react';

export interface ChannelProps {
  children?: React.ReactNode;
}

export const Channel: React.FC<ChannelProps> = ({ children }) => (
  <div data-testid="channel">{children}</div>
);

export default Channel;
