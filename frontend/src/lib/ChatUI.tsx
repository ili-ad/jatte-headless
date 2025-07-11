//frontend/src/lib/ChatUI.tsx
'use client'

import { Chat, Channel, Window, MessageList, MessageInput } from '@iliad/stream-chat-shim';

import { useChat } from './ChatProvider';
import ErrorBoundary from './ErrorBoundary';

export default function ChatUI() {
  const { client, channel } = useChat();
  if (!client || !channel) return null;
  return (
    <Chat client={client as any} theme="messaging light">
      <ErrorBoundary>
        <Channel channel={channel as any}>
          <Window>
            <MessageList />
            <MessageInput />
          </Window>
        </Channel>
      </ErrorBoundary>
    </Chat>
  );
}
