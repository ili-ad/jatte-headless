//frontend/src/lib/ChatProvider.tsx
'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import type { Channel as ChannelType, ChatClient } from '@/lib/stream-adapter';
import { Channel as AdapterChannel } from '@/lib/stream-adapter';
import { getStreamClient } from './getStreamClient';
import { getChatCreds } from './getChatCreds';
import { setAuthToken } from '@iliad/stream-chat-shim/api/chatAPI';
import { useSession } from './SessionProvider';

export const chatClient: ChatClient = getStreamClient();

interface ChatContextValue {
  client: ChatClient | null;
  channel: ChannelType | null;
  roomConfig: Record<string, any> | null;
}

const ChatContext = createContext<ChatContextValue>({ client: null, channel: null, roomConfig: null });

export function useChat() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const [client] = useState<ChatClient>(() => chatClient);
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [roomConfig, setRoomConfig] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let mounted = true;

    // When the Supabase session is gone, tear down the channel and (optionally) disconnect.
    if (!session) {
      setChannel(null);
      setRoomConfig(null);
      setAuthToken(null);

      const maybeDisconnect = (client as any).disconnectUser;
      if (typeof maybeDisconnect === 'function') {
        try {
          maybeDisconnect.call(client);
        } catch (err) {
          console.error('[ChatProvider] disconnectUser failed', err);
        }
      }

      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        const { userID, userToken } = await getChatCreds();
        setAuthToken(userToken);

        // Try to use the adapter’s connectUser if it exists.
        const maybeConnect = (client as any).connectUser;
        if (typeof maybeConnect === 'function') {
          await maybeConnect.call(client, { id: String(userID) }, userToken);
        } else {
          // Fallback: at least tag the user on the client so the adapter
          // and channel have something to work with.
          (client as any).user = { id: String(userID) };
        }

        // The adapter’s Channel uses client['jwt'] when hitting your backend & ws.
        (client as any).jwt = userToken;

        // Guard against client.channel being missing, to avoid hard crashes.
        const channelFactory = (client as any).channel;
        if (typeof channelFactory !== 'function') {
          console.error('[ChatProvider] client.channel is not a function', { client });
          return;
        }

        const chan = channelFactory.call(client, 'messaging', 'general') as AdapterChannel;
        await chan.watch();

        console.info('[ChatProvider] channel created', {
          isAdapterChannel: chan instanceof AdapterChannel,
          channelClass: chan.constructor?.name,
          clientClass: client.constructor?.name,
        });

        if (!mounted) return;
        setChannel(chan);
      } catch (err) {
        console.error('[ChatProvider] failed to initialize chat client/channel', err);
      }
    })();

    return () => {
      mounted = false;
      const maybeDisconnect = (client as any).disconnectUser;
      if (typeof maybeDisconnect === 'function') {
        try {
          maybeDisconnect.call(client);
        } catch (err) {
          console.error('[ChatProvider] disconnectUser failed on cleanup', err);
        }
      }
    };
  }, [client, session]);



  useEffect(() => {
    if (!channel) return;
    const handleNew = () => channel.markRead();
    channel.on('message.new', handleNew);
    return () => {
      channel.off('message.new', handleNew);
    };
  }, [channel]);

  useEffect(() => {
    let cancelled = false;
    if (!channel) return () => { cancelled = true; };

    (async () => {
      try {
        const composer: any = (channel as any).messageComposer;
        const configState = await composer?.getConfigState?.();
        const snapshot = configState ?? composer?.configState?.getSnapshot?.();
        if (!cancelled && snapshot) setRoomConfig(snapshot);
      } catch (err) {
        console.error('[ChatProvider] failed to load room config', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [channel]);

  return (
    <ChatContext.Provider value={{ client, channel, roomConfig }}>
      {children}
    </ChatContext.Provider>
  );
}
