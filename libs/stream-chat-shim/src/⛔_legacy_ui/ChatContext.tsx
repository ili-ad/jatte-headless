import React, { PropsWithChildren, useContext } from 'react';
import type {
  AppSettingsAPIResponse,
  Channel,
  Mute,
  StreamChat,
} from 'chat-shim';
import type { Theme } from './Chat';
import type { ChannelsQueryState } from './useChannelsQueryState';

/** Placeholder generic defaults matching the Stream Chat generics. */
export interface DefaultStreamChatGenerics {}

export type CustomClasses = Partial<Record<string, string>>;

export type ChatContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  channel?: Channel<StreamChatGenerics>;
  channelsQueryState: ChannelsQueryState;
  client: StreamChat<StreamChatGenerics>;
  closeMobileNav: () => void;
  customClasses?: CustomClasses;
  getAppSettings: () => Promise<AppSettingsAPIResponse<StreamChatGenerics>> | null;
  latestMessageDatesByChannels: Record<string, Date>;
  mutes: Array<Mute<StreamChatGenerics>>;
  navOpen?: boolean;
  openMobileNav: () => void;
  setActiveChannel: (
    newChannel?: Channel<StreamChatGenerics>,
    watchers?: { limit?: number; offset?: number },
    event?: React.BaseSyntheticEvent,
  ) => void;
  theme: Theme;
  themeVersion: '1' | '2';
  useImageFlagEmojisOnWindows: boolean;
  isMessageAIGenerated?: boolean;
};

const ChatContext = React.createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({ children, value }: PropsWithChildren<{ value: ChatContextValue<StreamChatGenerics> }>) => (
  <ChatContext.Provider value={value as unknown as ChatContextValue}>{children}</ChatContext.Provider>
);

export const useChatContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(componentName?: string) => {
  const contextValue = useContext(ChatContext);
  if (!contextValue) {
    console.warn(
      `The useChatContext hook was called outside of the ChatContext provider. Make sure this hook is called within a child of the Chat component. The errored call is located in the ${componentName} component.`,
    );
    return {} as ChatContextValue<StreamChatGenerics>;
  }
  return contextValue as unknown as ChatContextValue<StreamChatGenerics>;
};

const getDisplayName = (Component: React.ComponentType<any>) =>
  Component.displayName || Component.name || 'Component';

export const withChatContext = <
  P extends Record<string, any>,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(Component: React.ComponentType<P>) => {
  const WithChatContextComponent = (
    props: Omit<P, keyof ChatContextValue<StreamChatGenerics>>,
  ) => {
    const chatContext = useChatContext<StreamChatGenerics>();
    return <Component {...(props as P)} {...chatContext} />;
  };
  WithChatContextComponent.displayName = `WithChatContext${getDisplayName(Component)}`;
  return WithChatContextComponent;
};

export { ChatContext };
export type { ChatContextValue };
export default ChatContext;
