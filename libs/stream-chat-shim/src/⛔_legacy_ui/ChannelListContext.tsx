import React, { createContext, useContext } from 'react';

export type ChannelListContextValue = {
  /** List of available channels */
  channels?: any[];
  /** Loading state for channel list */
  loading?: boolean;
  /** Set the active channel */
  setActiveChannel?: (channel: any) => void;
};

/** React context used to share channel list state */
export const ChannelListContext = createContext<ChannelListContextValue>({
  channels: [],
  loading: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setActiveChannel: () => {},
});

export const useChannelListContext = () => useContext(ChannelListContext);

export default ChannelListContext;
