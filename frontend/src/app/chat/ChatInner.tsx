// frontend/src/app/chat/ChatInner.tsx
'use client';

import { Chat, Channel, MessageList, MessageInput } from '@iliad/stream-ui';
import { ChatClient } from '@/lib/stream-adapter';
import { useEffect, useState } from 'react';

const USER_ID = 'demo-user';
const TOKEN = 'dummy-jwt';
const ROOM_ID = 'demo-room';

export default function ChatInner() {
  const [client] = useState(() => new ChatClient(USER_ID, TOKEN));
  const [channel, setChannel] = useState<any | null>(null);

  useEffect(() => {
    client.connectUser({ id: USER_ID }, TOKEN).then(() => {
      const chan = client.channel('messaging', ROOM_ID);
      setChannel(chan);
    });

    return () => {
      client.disconnectUser();
    };
  }, [client]);

  if (!channel) return null;

  return (
    <Chat client={client as any} theme="messaging light">
      <Channel channel={channel as any}>
        <MessageList />
        <MessageInput />
      </Channel>
    </Chat>
  );
}
