//frontend/src/app/demo/page.tsx

'use client'

import { ChatProvider, useChat } from '@/lib/ChatProvider';
import ChatUI from '@/lib/ChatUI';
import { useEffect } from 'react';

function HelloWorldSender() {
  const { channel } = useChat();
  useEffect(() => {
    if (!channel) return;
    channel.sendMessage({ text: 'hello world' });
  }, [channel]);
  return null;
}

export default function DemoPage() {
  return (
    <ChatProvider>
      <HelloWorldSender />
      <ChatUI />
    </ChatProvider>
  );
}
