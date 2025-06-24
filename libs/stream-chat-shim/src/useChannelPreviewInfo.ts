import { useEffect, useState } from 'react';
import type { Channel } from 'stream-chat';

export type ChannelPreviewInfoParams<StreamChatGenerics extends unknown = unknown> = {
  channel: Channel<StreamChatGenerics>;
  /** Manually set the image to render, defaults to the Channel image */
  overrideImage?: string;
  /** Set title manually */
  overrideTitle?: string;
};

const getDisplayTitle = <StreamChatGenerics extends unknown>(
  channel: Channel<StreamChatGenerics>,
  currentUser?: { id?: string },
) => {
  let title = (channel.data as any)?.name as string | undefined;
  const members = Object.values(channel.state.members);
  if (!title && members.length === 2) {
    const otherMember = members.find((m) => (m as any).user?.id !== currentUser?.id);
    if (otherMember && (otherMember as any).user?.name) {
      title = (otherMember as any).user.name;
    }
  }
  return title;
};

const getDisplayImage = <StreamChatGenerics extends unknown>(
  channel: Channel<StreamChatGenerics>,
  currentUser?: { id?: string },
) => {
  let image = (channel.data as any)?.image as string | undefined;
  const members = Object.values(channel.state.members);
  if (!image && members.length === 2) {
    const otherMember = members.find((m) => (m as any).user?.id !== currentUser?.id);
    if (otherMember && (otherMember as any).user?.image) {
      image = (otherMember as any).user.image;
    }
  }
  return image;
};

/**
 * Lightweight replacement for Stream's `useChannelPreviewInfo` hook.
 */
export const useChannelPreviewInfo = <
  StreamChatGenerics extends unknown = unknown,
>(props: ChannelPreviewInfoParams<StreamChatGenerics>) => {
  const { channel, overrideImage, overrideTitle } = props;

  const client = (channel as any).client;
  const user = client?.user;

  const [displayTitle, setDisplayTitle] = useState(
    () => getDisplayTitle(channel, user),
  );
  const [displayImage, setDisplayImage] = useState(
    () => getDisplayImage(channel, user),
  );

  useEffect(() => {
    if (!client) return;
    const handleEvent = () => {
      setDisplayTitle((prev) => {
        const newTitle = getDisplayTitle(channel, client.user);
        return prev !== newTitle ? newTitle : prev;
      });
      setDisplayImage((prev) => {
        const newImage = getDisplayImage(channel, client.user);
        return prev !== newImage ? newImage : prev;
      });
    };
    client.on('user.updated', handleEvent);
    return () => {
      client.off('user.updated', handleEvent);
    };
  }, [channel, client]);

  return {
    displayImage: overrideImage || (displayImage as string | undefined),
    displayTitle: overrideTitle || displayTitle,
  };
};
