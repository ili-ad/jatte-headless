'use client';

import {
  Chat,
  Channel,
  Window,
  MessageList,
  TypingIndicator,
  MessageInput,
} from '@iliad/stream-chat-shim';

import { useChat } from './ChatProvider';
import ErrorBoundary from './ErrorBoundary';

export default function ChatWindow() {
  const { client, channel } = useChat();

  if (!client || !channel) return null;

  return (
    <Chat client={client as any} theme="messaging light">
      <ErrorBoundary>
        <Channel channel={channel as any}>
          <Window>
            <MessageList />
            <TypingIndicator />
            <MessageInput maxRows={6} minRows={1} />
          </Window>
        </Channel>
      </ErrorBoundary>
    </Chat>
  );
}
