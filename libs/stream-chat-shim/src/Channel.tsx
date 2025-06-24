import React from 'react';

export interface ChannelProps {
  children?: React.ReactNode;
}

export const Channel: React.FC<ChannelProps> = ({ children }) => (
  <div data-testid="channel">{children}</div>
);

export default Channel;
  /** Channel instance from the chat client */
  channel?: any;
  /** React children to render inside the channel */
  children?: React.ReactNode;
}

/** Placeholder Channel component used while the real implementation is ported. */
export function Channel({ children }: ChannelProps) {
  return <>{children}</>;
}
