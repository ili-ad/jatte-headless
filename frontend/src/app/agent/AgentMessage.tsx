'use client';

import React from 'react';
import { MessageSimple, type MessageProps } from '@iliad/stream-chat-shim';

function getAuthorId(message: any): string | undefined {
  if (!message) return undefined;
  return message.user?.id ?? message.user_id ?? message.sent_by;
}

export type AgentMessageProps = MessageProps & {
  currentUserId?: string;
};

export function AgentMessage(props: AgentMessageProps) {
  const { currentUserId: _currentUserId, ...messageProps } = props;
  const { message } = messageProps;

  if (!message) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[AgentMessage] rendered without message prop', props);
    }
    return null;
  }

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[AgentMessage] render message', {
      id: (message as any).id,
      user_id: (message as any).user_id ?? message.user?.id,
      text: message.text,
    });
  }

  const authorId = getAuthorId(message);
  const isAgent =
    authorId === 'ai-bot-agent-lab' || Boolean((message as any).custom_data?.ai_generated);

  const rag = (message as any).custom_data?.rag as { used?: boolean; k?: number } | undefined;

  return (
    <div className="space-y-1">
      {/* Default Stream/adapter message bubble */}
      <MessageSimple {...messageProps} />

      {isAgent && rag?.used && (
        <div className="flex items-center gap-1 text-[11px] text-neutral-500 pl-10">
          <span>ⓘ</span>
          <span>
            Based on {rag.k ?? 1} sections from NTO&apos;s lien library.
          </span>
        </div>
      )}
    </div>
  );
}
