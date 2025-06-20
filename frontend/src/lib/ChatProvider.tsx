'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import type { StreamChat, Channel } from 'stream-chat';
import { getStreamClient } from './getStreamClient';
import { getToken } from './getToken';

interface ChatContextValue {
  client: StreamChat | null;
  channel: Channel | null;
}

const ChatContext = createContext<ChatContextValue>({ client: null, channel: null });

export function useChat() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [client] = useState<StreamChat>(() => getStreamClient());
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    let mounted = true;
    getToken()
      .then(({ userID, userToken }) => client.connectUser({ id: userID }, userToken))
      .then(() => {
        const chan = client.channel('messaging', 'general');
        return chan.watch().then(() => chan);
      })
      .then((chan) => {
        if (!mounted) return;
        setChannel(chan);
      });
    return () => {
      mounted = false;
      client.disconnectUser();
    };
  }, [client]);

  useEffect(() => {
    if (!channel) return;
    const logEvent = (e: any) => console.log('channel event', e);
    const handleNew = () => channel.markRead();
    channel.on('*', logEvent);
    channel.on('message.new', handleNew);
    return () => {
      channel.off('*', logEvent);
      channel.off('message.new', handleNew);
    };
  }, [channel]);

  return (
    <ChatContext.Provider value={{ client, channel }}>
      {children}
    </ChatContext.Provider>
  );
}
