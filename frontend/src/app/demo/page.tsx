//frontend/src/app/demo/page.tsx

'use client'

//import { ChatProvider, useChat } from '@/lib/ChatProvider';
import { ChatProvider, useChat } from '@/lib/ChatProvider';
import ChatUI from '@/lib/ChatUI';
import ChatGuard from '@/components/ChatGuard';
import { useEffect } from 'react';

function HelloWorldSender() {
  const { channel } = useChat();

  useEffect(() => {
    if (!channel) return;

    // send once the local state flips to “ready”
    if (channel.initialized) {
      channel.sendMessage({ text: 'hello world' });
      return;
    }

    const handleReady = () => {
      channel.sendMessage({ text: 'hello world' });
      channel.off('initialized', handleReady);
    };

    channel.on('initialized', handleReady);
    return () => channel.off('initialized', handleReady);
  }, [channel]);

  return null;
}


export default function DemoPage() {
  return (
    <ChatProvider>
      <HelloWorldSender />
      <ChatGuard>
        <ChatUI />
      </ChatGuard>
    </ChatProvider>
  );
}
