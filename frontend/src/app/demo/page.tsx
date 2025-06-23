//frontend/src/app/demo/page.tsx

'use client'

import { ChatProvider, useChat } from '@/lib/ChatProvider';
import ChatUI from '@/lib/ChatUI';
import ChatGuard from '@/components/ChatGuard';
import { useEffect } from 'react';

function HelloWorldSender() {
  const { channel } = useChat();

  useEffect(() => {
    if (!channel) return;

    const client = channel.getClient();

    // Stream Chat keeps its websocket on `client.wsConnection`
    // (non-public, so cast to any to placate TS)
    const sock: WebSocket | undefined = (client as any).wsConnection;

    const send = () => channel.sendMessage({ text: 'hello world' });

    if (sock?.readyState === WebSocket.OPEN) {
      // Already connected → fire immediately
      send();
      return;
    }

    // Otherwise wait once for the connection to open
    const handleOpen = () => {
      send();
      sock?.removeEventListener('open', handleOpen);
    };

    sock?.addEventListener('open', handleOpen);

    // Clean up if the component unmounts before the socket opens
    return () => sock?.removeEventListener('open', handleOpen);
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
