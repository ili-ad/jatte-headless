'use client';

import dynamic from 'next/dynamic';

import ChatGuard from '../../components/ChatGuard';

/**
 * Dedicated agent chat sandbox.
 * Skip SSR for the heavy chat UI – it will be
 * loaded and rendered only in the browser.
 */
const ChatInner = dynamic(() => import('../chat/ChatInner'), { ssr: false });

export default function AgentPage() {
  return (
    <ChatGuard whenUnauthed="redirect">
      <ChatInner
        roomSlug="agent-lab"
        heading="Agent lab"
        description="Talk to the assistant-enabled sandbox room."
        useAgentUI
      />
    </ChatGuard>
  );
}
