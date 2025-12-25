'use client';

import {
  Chat,
  Channel,
  Window,
  MessageList,
  TypingIndicator,
  MessageInput,
} from '@iliad/stream-chat-shim';

import { useEffect, useState } from 'react';

import { useChat } from './ChatProvider';
import ErrorBoundary from './ErrorBoundary';
import ChatBootstrapNotice from './ChatBootstrapNotice';


function useStreamChatThemeClass() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains('dark'));
    update();

    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // IMPORTANT:
  // - Our CSS bundle (stream-chat-shim v2) defines theme variables on `.str-chat__theme-dark` / `.str-chat__theme-light`.
  // - Stream's newer "messaging dark/light" classes alone won't change colors unless your CSS contains those selectors.
  return isDark
    ? 'messaging dark str-chat__theme-dark'
    : 'messaging light str-chat__theme-light';
}

export default function ChatWindow() {
  const { client, channel, bootstrapStatus, retryBootstrap } = useChat();

  
  const streamTheme = useStreamChatThemeClass();
const ready = client && channel && bootstrapStatus.kind === 'ready';

  if (!ready) {
    return <ChatBootstrapNotice status={bootstrapStatus} onRetry={retryBootstrap} />;
  }

  if (!client || !channel) return null;

  return (
    <Chat client={client as any} theme={streamTheme} key={streamTheme}>
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
