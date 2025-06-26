import React from 'react';

export type ChannelAvatarProps = Record<string, any>;

export type ChannelHeaderProps = {
  Avatar?: React.ComponentType<ChannelAvatarProps>;
  image?: string;
  live?: boolean;
  MenuIcon?: React.ComponentType;
  title?: string;
};

/** Placeholder implementation of ChannelHeader. */
export const ChannelHeader = (_props: ChannelHeaderProps) => {
  return <div data-placeholder='ChannelHeader' />;
};
