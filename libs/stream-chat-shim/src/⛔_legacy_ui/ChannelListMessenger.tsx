import React from 'react';
import type { PropsWithChildren } from 'react';
import type { Channel } from 'chat-shim';

/** Props accepted by {@link ChannelListMessenger} */
export type ChannelListMessengerProps = {
  /** Whether the channel query request returned an errored response */
  error: any | null;
  /** The channels currently loaded in the list, only defined if `sendChannelsToList` on `ChannelList` is true */
  loadedChannels?: Channel[];
  /** Whether the channels are currently loading */
  loading?: boolean;
  /** Custom UI component to display the loading error indicator */
  LoadingErrorIndicator?: React.ComponentType;
  /** Custom UI component to display a loading indicator */
  LoadingIndicator?: React.ComponentType;
  /** Local state hook that resets the currently loaded channels */
  setChannels?: React.Dispatch<React.SetStateAction<Channel[]>>;
};

/**
 * Minimal placeholder implementation of the ChannelListMessenger component.
 * It simply renders `children` wrapped in a <div>.
 */
export const ChannelListMessenger = (
  props: PropsWithChildren<ChannelListMessengerProps>,
) => {
  const { children } = props;
  return <div>{children}</div>;
};

export default ChannelListMessenger;
