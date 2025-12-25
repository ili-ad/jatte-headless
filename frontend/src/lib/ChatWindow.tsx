'use client';

import { useEffect, useState } from 'react';

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
import ChatBootstrapNotice from './ChatBootstrapNotice';

function useStreamMessagingTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains('dark'));
    update();

    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return isDark ? 'messaging dark' : 'messaging light';
}

export default function ChatWindow() {
  const { client, channel, bootstrapStatus, retryBootstrap } = useChat();

  
  const streamTheme = useStreamMessagingTheme();
const ready = client && channel && bootstrapStatus.kind === 'ready';

  if (!ready) {
    return <ChatBootstrapNotice status={bootstrapStatus} onRetry={retryBootstrap} />;
  }

  if (!client || !channel) return null;

  return (
    <Chat client={client as any} theme={streamTheme}>
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
