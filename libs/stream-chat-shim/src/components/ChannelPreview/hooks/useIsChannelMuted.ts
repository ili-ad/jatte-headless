import { useEffect, useMemo, useState } from 'react';

import { chatAPI, type MuteStatus } from '../../../api/chatAPI';
import { useChatContext } from '../../../context/ChatContext';

import type { Channel } from 'chat-shim';

const DEFAULT_STATUS: MuteStatus = { muted: false, muted_until: null };

const normalizeStatus = (status: unknown): MuteStatus => {
  if (!status || typeof status !== 'object') {
    return DEFAULT_STATUS;
  }

  const maybe = status as Partial<MuteStatus> & Record<string, unknown>;
  let muted_until: string | null = null;

  if (typeof maybe.muted_until === 'string') {
    muted_until = maybe.muted_until;
  } else if (maybe.muted_until instanceof Date) {
    muted_until = maybe.muted_until.toISOString();
  } else if (maybe.muted_until === null) {
    muted_until = null;
  }

  return {
    muted: Boolean(maybe.muted),
    muted_until,
  };
};

export const useIsChannelMuted = (channel: Channel): MuteStatus => {
  const { client } = useChatContext('useIsChannelMuted');

  const initialStatus = useMemo(() => {
    const existing = typeof channel.muteStatus === 'function'
      ? channel.muteStatus()
      : undefined;
    const normalized = normalizeStatus(existing);
    const channelWithSetter = channel as Channel & {
      setMuteStatus?: (s: MuteStatus) => void;
    };
    if (typeof channelWithSetter.setMuteStatus === 'function') {
      channelWithSetter.setMuteStatus(normalized);
    }
    return normalized;
  }, [channel]);

  const [status, setStatus] = useState<MuteStatus>(initialStatus);

  useEffect(() => {
    setStatus(normalizeStatus(
      typeof channel.muteStatus === 'function' ? channel.muteStatus() : undefined,
    ));
  }, [channel]);

  useEffect(() => {
    let isMounted = true;

    const applyStatus = (next: MuteStatus) => {
      if (!isMounted) return;
      setStatus(next);

      const channelWithSetter = channel as Channel & {
        setMuteStatus?: (s: MuteStatus) => void;
        getClient?: () => { mutedChannels?: string[] };
      };

      if (typeof channelWithSetter.setMuteStatus === 'function') {
        channelWithSetter.setMuteStatus(next);
      } else {
        const fallbackStatus: MuteStatus = { ...next };
        channelWithSetter.muteStatus = () => fallbackStatus;
        const clientInstance = channelWithSetter.getClient?.();
        if (clientInstance && Array.isArray(clientInstance.mutedChannels)) {
          const index = clientInstance.mutedChannels.indexOf(channel.cid);
          if (next.muted && index === -1) {
            clientInstance.mutedChannels.push(channel.cid);
          } else if (!next.muted && index !== -1) {
            clientInstance.mutedChannels.splice(index, 1);
          }
        }
      }
    };

    const fetchStatus = async () => {
      try {
        const data = await chatAPI.muteStatus({ cid: channel.cid });
        applyStatus(data);
      } catch (error) {
        // Swallow errors to keep optimistic UI behaviour consistent with Stream UI.
      }
    };

    void fetchStatus();

    const handleEvent = () => {
      void fetchStatus();
    };

    const subscription = chatAPI.client.on(
      client,
      'notification.mutes_updated',
      handleEvent,
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [channel, client]);

  return status;
};
