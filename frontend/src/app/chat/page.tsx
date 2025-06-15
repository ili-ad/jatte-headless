'use client';

import dynamic from 'next/dynamic';

/**
 * Skip SSR for the heavy chat UI – it will be
 * loaded and rendered **only in the browser**.
 */
const ChatInner = dynamic(() => import('./ChatInner'), { ssr: false });

export default function ChatPage() {
  return <ChatInner />;
}
