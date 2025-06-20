'use client'

import { Chat, Channel, Window, MessageList, MessageInput } from '@iliad/stream-ui';
import { useChat } from './ChatProvider';

export default function ChatUI() {
  const { client, channel } = useChat();
  if (!client || !channel) return null;
  return (
    <Chat client={client as any} theme="messaging light">
      <Channel channel={channel as any}>
        <Window>
          <MessageList />
          <MessageInput />
        </Window>
      </Channel>
    </Chat>
  );
}
