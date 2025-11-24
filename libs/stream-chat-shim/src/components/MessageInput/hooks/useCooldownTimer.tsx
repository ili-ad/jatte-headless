import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { ChannelResponse } from 'chat-shim';

import { useChannelStateContext, useChatContext } from '../../../context';

const toValidDate = (input?: Date | string | number | null) => {
  if (!input) return undefined;

  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export type CooldownTimerState = {
  cooldownInterval: number;
  setCooldownRemaining: React.Dispatch<React.SetStateAction<number | undefined>>;
  cooldownRemaining?: number;
};

export const useCooldownTimer = (): CooldownTimerState => {
  const { client, latestMessageDatesByChannels } = useChatContext('useCooldownTimer');
  const { channel, messages = [] } = useChannelStateContext('useCooldownTimer');
  const [cooldownRemaining, setCooldownRemaining] = useState<number>();

  const { cooldown: cooldownInterval = 0, own_capabilities } = (channel.data ||
    {}) as ChannelResponse;

  const skipCooldown = own_capabilities?.includes('skip-slow-mode');

  const ownLatestMessageDate = useMemo(() => {
    const channelLatest = toValidDate(latestMessageDatesByChannels[channel.cid]);
    if (channelLatest) return channelLatest;

    return messages
      .map((message) => ({ message, createdAt: toValidDate(message.created_at) }))
      .filter(
        ({ message, createdAt }) =>
          (message.user?.id ?? message.user_id) === client.user?.id && createdAt,
      )
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
      .find(Boolean)?.createdAt as Date | undefined;
  }, [messages, client.user?.id, latestMessageDatesByChannels, channel.cid]);

  useEffect(() => {
    const timeSinceOwnLastMessage = ownLatestMessageDate
      ? // prevent negative values
        Math.max(0, (new Date().getTime() - ownLatestMessageDate.getTime()) / 1000)
      : undefined;

    const remaining =
      !skipCooldown &&
      typeof timeSinceOwnLastMessage !== 'undefined' &&
      cooldownInterval > timeSinceOwnLastMessage
        ? Math.round(cooldownInterval - timeSinceOwnLastMessage)
        : 0;

    setCooldownRemaining(remaining);

    if (!remaining) return;

    const timeout = setTimeout(() => {
      setCooldownRemaining(0);
    }, remaining * 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [cooldownInterval, ownLatestMessageDate, skipCooldown]);

  return {
    cooldownInterval,
    cooldownRemaining,
    setCooldownRemaining,
  };
};
