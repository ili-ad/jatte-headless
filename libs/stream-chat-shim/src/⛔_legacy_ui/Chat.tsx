import React, { PropsWithChildren } from 'react';
import type { StreamChat } from 'chat-shim';

/**
 * Theme options supported by Stream Chat.
 * @deprecated will be removed with the transition to the theming v2.
 */
export type Theme<T extends string = string> =
  | 'commerce dark'
  | 'commerce light'
  | 'livestream dark'
  | 'livestream light'
  | 'messaging dark'
  | 'messaging light'
  | 'team dark'
  | 'team light'
  | T;

export type ChatProps<StreamChatGenerics = unknown> = {
  /** The StreamChat client object */
  client: StreamChat<StreamChatGenerics>;
  /** Object containing custom CSS classnames to override the library's defaults */
  customClasses?: Record<string, string>;
  /** Custom CSS variables */
  customStyles?: Record<string, string>;
  /** Enable dark mode color palette */
  darkMode?: boolean;
  /** Default fallback language */
  defaultLanguage?: string;
  /** Instance of Stream i18n */
  i18nInstance?: unknown;
  /** Initial status of mobile navigation */
  initialNavOpen?: boolean;
  /** Class names applied to Channel and ChannelList components */
  theme?: string;
  /** Use custom emoji font for Windows users */
  useImageFlagEmojisOnWindows?: boolean;
};

/**
 * Placeholder Chat component used while the real implementation is ported.
 */
export const Chat = <StreamChatGenerics,>(
  props: PropsWithChildren<ChatProps<StreamChatGenerics>>,
) => {
  const { children } = props;
  return <div data-testid="chat">{children}</div>;
};

export default Chat;
