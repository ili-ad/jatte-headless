// libs/stream-chat-shim/src/channelList-utils.ts
// Lightweight shim for Stream's ChannelList utility helpers.
// Implements minimal versions of helpers used by the UI.

// simple uniqBy helper to avoid extra dependencies
function uniqBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set<unknown>();
  const out: T[] = [];
  for (const item of arr) {
    const val = (item as any)[key];
    if (!seen.has(val)) {
      seen.add(val);
      out.push(item);
    }
  }
  return out;
}

import type { Channel, ChannelSort, ChannelSortBase } from 'chat-shim';
import type { ChannelListProps } from './ChannelList';

export const MAX_QUERY_CHANNELS_LIMIT = 30;

type MoveChannelUpParams = {
  channels: Array<Channel>;
  cid: string;
  activeChannel?: Channel;
};

/**
 * @deprecated
 * Minimal re-implementation of Stream's `moveChannelUp` helper.
 */
export const moveChannelUp = ({ activeChannel, channels, cid }: MoveChannelUpParams) => {
  const channelIndex = channels.findIndex((channel) => channel.cid === cid);
  if (!activeChannel && channelIndex <= 0) return channels;
  const channel = activeChannel || channels[channelIndex];
  return uniqBy([channel, ...channels], 'cid');
};

export function findLastPinnedChannelIndex({ channels }: { channels: Channel[] }) {
  let lastPinnedChannelIndex: number | null = null;
  for (const channel of channels) {
    if (!isChannelPinned(channel)) break;
    if (typeof lastPinnedChannelIndex === 'number') {
      lastPinnedChannelIndex++;
    } else {
      lastPinnedChannelIndex = 0;
    }
  }
  return lastPinnedChannelIndex;
}

type MoveChannelUpwardsParams = {
  channels: Array<Channel>;
  channelToMove: Channel;
  sort: ChannelSort;
  channelToMoveIndexWithinChannels?: number;
};

export const moveChannelUpwards = ({
  channels,
  channelToMove,
  channelToMoveIndexWithinChannels,
  sort,
}: MoveChannelUpwardsParams) => {
  const targetChannelIndex =
    channelToMoveIndexWithinChannels ?? channels.findIndex((c) => c.cid === channelToMove.cid);
  const targetChannelExistsWithinList = targetChannelIndex >= 0;
  const targetChannelAlreadyAtTheTop = targetChannelIndex === 0;

  const considerPinnedChannels = shouldConsiderPinnedChannels(sort);
  const isTargetChannelPinned = isChannelPinned(channelToMove);

  if (targetChannelAlreadyAtTheTop || (considerPinnedChannels && isTargetChannelPinned)) {
    return channels;
  }

  const newChannels = [...channels];

  if (targetChannelExistsWithinList) {
    newChannels.splice(targetChannelIndex, 1);
  }

  let lastPinnedChannelIndex: number | null = null;
  if (considerPinnedChannels) {
    lastPinnedChannelIndex = findLastPinnedChannelIndex({ channels: newChannels });
  }

  newChannels.splice(
    typeof lastPinnedChannelIndex === 'number' ? lastPinnedChannelIndex + 1 : 0,
    0,
    channelToMove,
  );

  return newChannels;
};

export const shouldConsiderPinnedChannels = (sort: ChannelListProps['sort']) => {
  const value = extractSortValue({ atIndex: 0, sort, targetKey: 'pinned_at' });
  if (typeof value !== 'number') return false;
  return Math.abs(value) === 1;
};

export const extractSortValue = ({
  atIndex,
  sort,
  targetKey,
}: {
  atIndex: number;
  targetKey: keyof ChannelSortBase;
  sort?: ChannelListProps['sort'];
}) => {
  if (!sort) return null;
  let option: null | ChannelSortBase = null;
  if (Array.isArray(sort)) {
    option = sort[atIndex] ?? null;
  } else {
    let index = 0;
    for (const key in sort) {
      if (index !== atIndex) {
        index++;
        continue;
      }
      if (key !== targetKey) {
        return null;
      }
      option = sort;
      break;
    }
  }
  return option?.[targetKey] ?? null;
};

export const shouldConsiderArchivedChannels = (filters: ChannelListProps['filters']) => {
  if (!filters) return false;
  return typeof filters.archived === 'boolean';
};

export const isChannelPinned = (channel: Channel) => {
  if (!channel) return false;
  const membership = channel.state.membership;
  return typeof (membership as any).pinned_at === 'string';
};

export const isChannelArchived = (channel: Channel) => {
  if (!channel) return false;
  const membership = channel.state.membership;
  return typeof (membership as any).archived_at === 'string';
};
