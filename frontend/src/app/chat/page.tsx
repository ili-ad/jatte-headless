// frontend/src/app/chat/page.tsx
'use client';
import { Chat, Channel, MessageList, MessageInput } from '@iliad/stream-ui';
import { ChatClient } from '@/lib/stream-adapter';

export default function ChatDemo() {
  const client = new ChatClient('demo-user', 'dummy-jwt');
  const channel = client.channel('messaging', 'demo-room');
  return (
    <Chat client={client as any} theme="messaging light">
      <Channel channel={channel as any}>
        <MessageList />
        <MessageInput />
      </Channel>
    </Chat>
  );
}
