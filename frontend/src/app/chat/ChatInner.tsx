// frontend/src/app/chat/ChatInner.tsx
'use client';

import { PropsWithChildren } from 'react';

import { ChatProvider, ChatUI, ChatWindow } from '@/chat-kit';

interface ChatInnerProps {
  roomSlug?: string;
  heading?: string;
  description?: string;
  useAgentUI?: boolean;
}

export default function ChatInner({
  roomSlug,
  heading,
  description,
  useAgentUI = false,
}: PropsWithChildren<ChatInnerProps>) {
  const ChatComponent = useAgentUI ? ChatUI : ChatWindow;

  return (
    <ChatProvider roomSlug={roomSlug}>
      {heading ? (
        <div style={{ marginBottom: '0.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{heading}</h1>
          {description ? <p style={{ color: '#4b5563' }}>{description}</p> : null}
        </div>
      ) : null}
      <ChatComponent />
    </ChatProvider>
  );
}
