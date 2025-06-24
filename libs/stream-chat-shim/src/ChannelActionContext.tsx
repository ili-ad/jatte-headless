import React, { createContext, useContext, PropsWithChildren } from 'react';

export type ChannelActionContextValue = {
  closeThread?: () => void;
  loadMore?: (...args: any[]) => Promise<void> | void;
  loadMoreNewer?: (...args: any[]) => Promise<void> | void;
  openThread?: (...args: any[]) => void;
  onMentionsClick?: (...args: any[]) => void;
  onMentionsHover?: (...args: any[]) => void;
  removeMessage?: (...args: any[]) => Promise<void> | void;
  retrySendMessage?: (...args: any[]) => void;
  sendMessage?: (...args: any[]) => Promise<void> | void;
};

const ChannelActionContext = createContext<ChannelActionContextValue>({});

export const useChannelActionContext = () => useContext(ChannelActionContext);

export const ChannelActionProvider = (
  props: PropsWithChildren<ChannelActionContextValue>,
) => {
  const { children, ...value } = props;
  return (
    <ChannelActionContext.Provider value={value}>{children}</ChannelActionContext.Provider>
  );
};

export default ChannelActionContext;
