import React, { type ReactNode } from 'react';
import type { Channel } from 'stream-chat';

export type ChannelAvatarProps = Record<string, any>;
export type GroupChannelDisplayInfo = Record<string, any>;
export type LocalMessage = any;
export type MessageDeliveryStatus = any;
export type TranslationContextValue = {
  t?: (key: string) => string;
  userLanguage?: string;
};
export type ChatContextValue = {
  setActiveChannel?: (...args: any[]) => void;
  isMessageAIGenerated?: boolean;
};

export type ChannelPreviewProps = {
  channel: Channel;
  active?: boolean;
  activeChannel?: Channel;
  Avatar?: React.ComponentType<ChannelAvatarProps>;
  channelUpdateCount?: number;
  className?: string;
  getLatestMessagePreview?: (
    channel: Channel,
    t: TranslationContextValue['t'],
    userLanguage: TranslationContextValue['userLanguage'],
    isMessageAIGenerated: ChatContextValue['isMessageAIGenerated'],
  ) => ReactNode;
  key?: string;
  onSelect?: (event: React.MouseEvent) => void;
  Preview?: React.ComponentType<ChannelPreviewUIComponentProps>;
  setActiveChannel?: ChatContextValue['setActiveChannel'];
  watchers?: { limit?: number; offset?: number };
};

export type ChannelPreviewUIComponentProps = ChannelPreviewProps & {
  displayImage?: string;
  displayTitle?: string;
  groupChannelDisplayInfo?: GroupChannelDisplayInfo;
  lastMessage?: LocalMessage;
  latestMessage?: ReactNode;
  latestMessagePreview?: ReactNode;
  messageDeliveryStatus?: MessageDeliveryStatus;
  unread?: number;
};

/** Placeholder implementation of ChannelPreview. */
export const ChannelPreview = (_props: ChannelPreviewProps) => {
  return <div data-testid="channel-preview-placeholder" />;
};

export default ChannelPreview;
