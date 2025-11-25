// frontend/src/app/chat/ChatInner.tsx
'use client';

import { PropsWithChildren } from 'react';

import { ChatProvider } from '@/lib/ChatProvider';
import ChatUI from '@/lib/ChatUI';

interface ChatInnerProps {
  roomSlug?: string;
  heading?: string;
  description?: string;
}

export default function ChatInner({ roomSlug, heading, description }: PropsWithChildren<ChatInnerProps>) {
  return (
    <ChatProvider roomSlug={roomSlug}>
      {heading ? (
        <div style={{ marginBottom: '0.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{heading}</h1>
          {description ? <p style={{ color: '#4b5563' }}>{description}</p> : null}
        </div>
      ) : null}
      <ChatUI />
    </ChatProvider>
  );
}
