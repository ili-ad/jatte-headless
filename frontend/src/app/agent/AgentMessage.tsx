'use client';

import React from 'react';
import { MessageSimple, type MessageProps } from '@iliad/stream-chat-shim';
import { getFormDefById, type FormDef, type FormSuggestion } from '@/lib/formsCatalog';

function getAuthorId(message: any): string | undefined {
  if (!message) return undefined;
  return message.user?.id ?? message.user_id ?? message.sent_by;
}

export type AgentMessageProps = MessageProps & {
  currentUserId?: string;
  onFormClick?: (form: FormDef, suggestion: FormSuggestion) => void;
};

export function AgentMessage(props: AgentMessageProps) {
  const { currentUserId: _currentUserId, onFormClick, ...messageProps } = props;
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
  const forms = (message as any).custom_data?.forms as FormSuggestion[] | undefined;

  const resolvedForms = (forms ?? [])
    .map((suggestion) => {
      const def = suggestion?.id ? getFormDefById(suggestion.id) : undefined;
      if (!def) return null;
      return { def, suggestion };
    })
    .filter(Boolean) as Array<{ def: FormDef; suggestion: FormSuggestion }>;

  const handleFormClick = (suggestion: FormSuggestion) => {
    const def = getFormDefById(suggestion.id);
    if (!def) return;

    if (onFormClick) {
      onFormClick(def, suggestion);
      return;
    }

    // Phase 1 placeholder: log selection for future integration
    // eslint-disable-next-line no-console
    console.log('[AgentMessage] form click', { form: def, suggestion });
  };

  return (
    <div className="space-y-1">
      {/* Default Stream/adapter message bubble */}
      <MessageSimple {...messageProps} />

      {isAgent && resolvedForms.length > 0 && (
        <div
          style={{
            marginLeft: '2.5rem',
            marginTop: '0.35rem',
            display: 'flex',
            flexDirection: 'column',
            rowGap: '0.35rem',
            paddingBottom: '0.25rem',
          }}
        >
          <span
            style={{
              fontSize: '0.80rem',
              color: '#374151',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            Suggested forms
          </span>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            {resolvedForms.map(({ def, suggestion }) => (
              <button
                key={def.id}
                type="button"
                title={suggestion.reason || def.blurb}
                onClick={() => handleFormClick(suggestion)}
                style={{
                  borderRadius: '9999px',
                  border: '1px solid #d1d5db',
                  padding: '0.3rem 0.75rem',
                  background: '#f9fafb',
                  fontSize: '0.80rem',
                  color: '#111827',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                {def.shortLabel || def.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isAgent && rag?.used && (
        <div
          // “meta” line: small, grey text, indented to line up under the bubble
          style={{
            marginLeft: '2.5rem',      // roughly the avatar gutter
            marginTop: '0.33rem',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            columnGap: '0.25rem',      // ~4px
            fontSize: '0.80rem',
            color: '#6b7280',          // Tailwind neutral-500-ish
            paddingTop: '2px',
            paddingBottom: '4px',
          }}
        >
          <span style={{fontSize: '1.1rem',}}>ⓘ</span>
          <span>
            Based on {rag.k ?? 1} sections from NTO&apos;s lien library.
          </span>
        </div>
      )}
    </div>
  );
}
