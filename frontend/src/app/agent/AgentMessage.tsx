'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageSimple, type MessageProps } from '@iliad/stream-chat-shim';
import {
  getSidecarItemById,
  type SidecarItemDef,
  type SidecarSuggestion,
} from '../../lib/sidecarCatalog';

type SidecarAction = { label: string; url: string; reason?: string };

function labelForSidecarItem(def: SidecarItemDef): string {
  return def.shortLabel || def.label;
}

function getAuthorId(message: any): string | undefined {
  if (!message) return undefined;
  return message.user?.id ?? message.user_id ?? message.sent_by;
}

export type AgentMessageProps = MessageProps & {
  currentUserId?: string;
  onFormClick?: (params: {
    def: SidecarItemDef;
    suggestion: SidecarSuggestion;
    messageId?: string;
  }) => void;
  currentStateSlug?: string;
  botUserId?: string | null;
};

export function AgentMessage(props: AgentMessageProps) {
  const { currentUserId: _currentUserId, onFormClick, currentStateSlug, ...messageProps } = props;
  const { message } = messageProps;
  const router = useRouter();

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
    (props.botUserId && authorId === props.botUserId) ||
    Boolean((message as any).custom_data?.ai_generated);

  const customData = (message as any)?.custom_data ?? {};
  const rag = customData?.rag as { used?: boolean; k?: number } | undefined;

  const sidecarSuggestions = (customData?.sidecar_items ?? []) as SidecarSuggestion[];
  const sidecarActions = (customData?.sidecar_actions ?? []) as SidecarAction[];

  const resolvedSidecarItems = (sidecarSuggestions ?? [])
    .map((suggestion) => {
      const def = suggestion?.id ? getSidecarItemById(suggestion.id) : undefined;
      if (!def) return null;
      return { def, suggestion };
    })
    .filter(Boolean) as Array<{ def: SidecarItemDef; suggestion: SidecarSuggestion }>;

  const handleSidecarClick = (suggestion: SidecarSuggestion) => {
    const def = suggestion?.id ? getSidecarItemById(suggestion.id) : undefined;
    if (!def) return;

    if (onFormClick) {
      onFormClick({ def, suggestion, messageId: (message as any)?.id });
      return;
    }

    if (def.kind === 'form' && currentStateSlug && def.slug) {
      router.push(`/forms/${currentStateSlug}/${def.slug}?sidecar_id=${def.id}`);
      return;
    }

    // eslint-disable-next-line no-console
    console.log('[agent/sidecar click]', { def, suggestion });
  };

  const handleSidecarActionClick = (action: SidecarAction) => {
    if (!action?.url) return;

    if (action.url.startsWith('/')) {
      router.push(action.url);
      return;
    }

    window.open(action.url, '_blank', 'noopener,noreferrer');
  };

  const sidecarButtonStyle: React.CSSProperties = {
    marginLeft: '2.5rem',
    marginTop: '0.33rem',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    columnGap: '0.25rem',
    fontSize: '0.80rem',
    color: '#FFF',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    paddingLeft: '1.0rem',
    paddingRight: '1.0rem',
    borderRadius: '10rem',
    border: 'none',
  };

  return (
    <div className="space-y-1">
      {/* Default Stream/adapter message bubble */}
      <MessageSimple {...messageProps} />

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
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
          }}
        >
          <span style={{fontSize: '1.1rem',}}>ⓘ</span>
          <span>
            Based on {rag.k ?? 1} sections from NTO&apos;s lien library.
          </span>
        </div>
      )}

      {isAgent && resolvedSidecarItems.length > 0 && (
        <div className="agent-forms-cta-row">
          <span className="agent-forms-label">Suggested resources:</span>
          <div className="agent-forms-buttons">
            {resolvedSidecarItems.map(({ def, suggestion }) => (
              <button
                key={def.id}
                type="button"
                className="agent-forms-button"
                onClick={() => handleSidecarClick(suggestion)}

                style={sidecarButtonStyle}

                title={suggestion.reason || def.blurb || labelForSidecarItem(def)}
              >
                {labelForSidecarItem(def)}
              </button>
            ))}
          </div>
        </div>
      )}

      {isAgent && sidecarActions.length > 0 && (
        <div className="agent-forms-cta-row">
          <span className="agent-forms-label">Suggested actions:</span>
          <div className="agent-forms-buttons">
            {sidecarActions.map((action, index) => (
              <button
                key={`${action.url}-${index}`}
                type="button"
                className="agent-forms-button"
                onClick={() => handleSidecarActionClick(action)}

                style={sidecarButtonStyle}

                title={action.reason || action.label}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
