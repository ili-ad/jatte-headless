'use client';

import React from 'react';
import { MessageSimple, type MessageProps } from '@iliad/stream-chat-shim';
import { useRouter } from 'next/navigation';

import {
  friendlyLabelForFormId,
  getFormDefById,
  type FormDef,
  type FormSuggestion,
} from '@/lib/formsCatalog';

function getAuthorId(message: any): string | undefined {
  if (!message) return undefined;
  return message.user?.id ?? message.user_id ?? message.sent_by;
}

export type AgentMessageProps = MessageProps & {
  currentUserId?: string;
  onFormClick?: (params: {
    def: FormDef;
    suggestion: FormSuggestion;
    messageId?: string;
  }) => void;
  currentStateSlug?: string;
};

export function AgentMessage(props: AgentMessageProps) {
  const { currentUserId: _currentUserId, onFormClick, currentStateSlug, ...messageProps } = props;
  const { message } = messageProps;
  const router = useRouter();

  if (!message) return null;

  const authorId = getAuthorId(message);
  const isAgent =
    authorId === 'ai-bot-agent-lab' || Boolean((message as any).custom_data?.ai_generated);

  const customData = (message as any)?.custom_data ?? {};
  const rag = customData?.rag as { used?: boolean; k?: number } | undefined;
  const forms = (customData?.forms ?? []) as FormSuggestion[];

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
      onFormClick({ def, suggestion, messageId: (message as any)?.id });
      return;
    }

    if (currentStateSlug && def.slug) {
      router.push(`/forms/${currentStateSlug}/${def.slug}?form_id=${def.id}`);
      return;
    }

    // eslint-disable-next-line no-console
    console.log('[agent/forms click]', { def, suggestion });
  };

  return (
    <div className="space-y-1">
      <MessageSimple {...messageProps} />

      {isAgent && rag?.used && (
        <div className="agent-rag-chip">ⓘ Based on {rag.k ?? 1} sections from the lien library.</div>
      )}

      {isAgent && resolvedForms.length > 0 && (
        <div className="agent-forms-cta-row">
          <span className="agent-forms-label">Suggested forms:</span>
          <div className="agent-forms-buttons">
            {resolvedForms.map(({ def, suggestion }) => (
              <button
                key={def.id}
                type="button"
                className="agent-forms-button"
                onClick={() => handleFormClick(suggestion)}
                title={suggestion.reason || friendlyLabelForFormId(def.id)}
              >
                {friendlyLabelForFormId(def.id)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
