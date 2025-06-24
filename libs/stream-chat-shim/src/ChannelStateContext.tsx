import React, { createContext, useContext, type PropsWithChildren } from 'react';

export type ChannelNotifications = Array<{
  id: string;
  text: string;
  type: 'success' | 'error';
}>;

export type ChannelState = {
  suppressAutoscroll: boolean;
  error?: Error | null;
  hasMore?: boolean;
  hasMoreNewer?: boolean;
  highlightedMessageId?: string;
  loading?: boolean;
  loadingMore?: boolean;
  loadingMoreNewer?: boolean;
  members?: any;
  messages?: any[];
  pinnedMessages?: any[];
  read?: any;
  thread?: any | null;
  threadHasMore?: boolean;
  threadLoadingMore?: boolean;
  threadMessages?: any[];
  threadSuppressAutoscroll?: boolean;
  typing?: any;
  watcherCount?: number;
  watchers?: any;
};

export type ChannelStateContextValue = Omit<ChannelState, 'typing'> & {
  channel: any;
  channelCapabilities: Record<string, boolean>;
  channelConfig: any;
  imageAttachmentSizeHandler: any;
  notifications: ChannelNotifications;
  shouldGenerateVideoThumbnail: boolean;
  videoAttachmentSizeHandler: any;
  channelUnreadUiState?: any;
  giphyVersion?: any;
  mutes?: Array<any>;
  watcher_count?: number;
};

export const ChannelStateContext = createContext<ChannelStateContextValue | undefined>(
  undefined,
);

export const ChannelStateProvider = ({
  children,
  value,
}: PropsWithChildren<{ value: ChannelStateContextValue }>) => (
  <ChannelStateContext.Provider value={value}>{children}</ChannelStateContext.Provider>
);

export const useChannelStateContext = (componentName?: string) => {
  const contextValue = useContext(ChannelStateContext);

  if (!contextValue) {
    console.warn(
      `The useChannelStateContext hook was called outside of the ChannelStateContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );
    return {} as ChannelStateContextValue;
  }

  return contextValue;
};

export const withChannelStateContext = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
) => {
  const WithChannelStateContextComponent = (
    props: Omit<P, keyof ChannelStateContextValue>,
  ) => {
    const channelStateContext = useChannelStateContext();
    return <Component {...(props as P)} {...channelStateContext} />;
  };

  WithChannelStateContextComponent.displayName = (
    Component.displayName || Component.name || 'Component'
  ).replace('Base', '');

  return WithChannelStateContextComponent;
};

export default ChannelStateContext;
