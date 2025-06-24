import { useEffect, useState } from 'react';
import type {
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  StreamChat,
} from 'stream-chat';

export type CustomQueryChannelParams = {
  currentChannels: Array<Channel>;
  queryType: 'reload' | 'load-more';
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>;
  setHasNextPage: React.Dispatch<React.SetStateAction<boolean>>;
};

export type CustomQueryChannelsFn = (
  params: CustomQueryChannelParams
) => Promise<void>;

/**
 * Placeholder implementation of usePaginatedChannels.
 * Returns a structure compatible with Stream's hook but with no real behaviour.
 */
export const usePaginatedChannels = (
  _client: StreamChat,
  _filters: ChannelFilters,
  _sort: ChannelSort,
  _options: ChannelOptions,
  _activeChannelHandler: (
    channels: Array<Channel>,
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>
  ) => void,
  _recoveryThrottleIntervalMs: number = 5000,
  _customQueryChannels?: CustomQueryChannelsFn
) => {
  const [channels, setChannels] = useState<Array<Channel>>([]);
  const [hasNextPage, setHasNextPage] = useState(true);

  useEffect(() => {
    // TODO: wire up Stream Chat client events
  }, []);

  const loadNextPage = () => {
    throw new Error('usePaginatedChannels not implemented');
  };

  return { channels, hasNextPage, loadNextPage, setChannels };
};
