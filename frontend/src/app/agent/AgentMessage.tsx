'use client';

import React from 'react';
import type { LocalMessage } from '@iliad/stream-chat-shim';

function getAuthorId(message: any): string | undefined {
  if (!message) return undefined;
  return message.user?.id ?? message.user_id ?? message.sent_by;
}

function getDisplayName(message: any, currentUserId?: string) {
  const uid = getAuthorId(message);

  if (uid === 'ai-bot-agent-lab') return 'AI assistant';
  if (currentUserId && uid === currentUserId) return 'You';

  const name = message?.user?.name;
  if (name) return name;

  const raw = String(uid ?? '');
  const short = raw.slice(0, 4).toUpperCase() || '????';
  return `Guest ${short}`;
}

export type AgentMessageProps = {
  message?: LocalMessage;
  currentUserId?: string;
} & Record<string, unknown>;

export function AgentMessage(props: AgentMessageProps) {
  const { currentUserId, message: rawMessage } = props as any;

  const message = rawMessage ?? (props as any).message ?? null;

  if (!message) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[AgentMessage] rendered without message prop', props);
    }
    return null;
  }

  const authorId = getAuthorId(message);
  const isAgent =
    authorId === 'ai-bot-agent-lab' || Boolean((message as any).custom_data?.ai_generated);

  const rag = (message as any).custom_data?.rag as { used?: boolean; k?: number } | undefined;

  const text = message.text ?? (message as any).body ?? '';

  return (
    <div className="space-y-1">
      <div className="text-xs text-neutral-500">
        {getDisplayName(message, currentUserId)}
      </div>
      <div className="rounded-2xl bg-neutral-100 px-3 py-2 text-sm text-neutral-900">
        {text}
      </div>

      {isAgent && rag?.used && (
        <div className="flex items-center gap-1 text-[11px] text-neutral-500">
          <span>ⓘ</span>
          <span>
            Based on {rag.k ?? 1} sections from NTO&apos;s lien library.
          </span>
        </div>
      )}
    </div>
  );
}
