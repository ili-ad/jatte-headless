// frontend/src/app/chat/ChatInner.tsx
'use client';

import { ChatProvider } from '@/lib/ChatProvider';
import ChatUI from '@/lib/ChatUI';

export default function ChatInner() {
  return (
    <ChatProvider>
      <ChatUI />
    </ChatProvider>
  );
}
