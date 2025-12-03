'use client';

import type { MessageProps } from '@iliad/stream-chat-shim';
import {
  Chat,
  Channel,
  Window,
  MessageList,
  TypingIndicator,
  MessageInput,
  AIStateIndicator,
} from '@iliad/stream-chat-shim';
import { useEffect } from 'react';

import type { LocalMessage } from 'chat-shim';
import { AgentMessage } from '@/app/agent/AgentMessage';

import { useChat } from './ChatProvider';
import ErrorBoundary from './ErrorBoundary';

export default function ChatUI() {
  const { client, channel } = useChat();

  useEffect(() => {
    if (!channel) return undefined;

    const store: any = (channel as any).stateStore;
    const logSnapshot = () => {
      try {
        const snapshot = store?.getSnapshot?.();
        if (snapshot && process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log('[agent/ui] messages snapshot', snapshot.messages);

          const messages: any[] = snapshot.messages ?? [];
          const aiMessages = messages.filter((m) => {
            const uid = m?.user?.id ?? m?.user_id;
            return uid === 'ai-bot-agent-lab' || Boolean((m as any).ai_generated);
          });

          // eslint-disable-next-line no-console
          console.log('[agent/ui] ai messages snapshot', aiMessages);

          // eslint-disable-next-line no-console
          console.log(
            '[agent/ui] ai rag summary',
            aiMessages.map((m: any) => ({
              id: m.id,
              rag: m.custom_data?.rag ?? null,
            })),
          );
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[agent/ui] failed to log messages snapshot', err);
      }
    };

    logSnapshot();
    const unsub =
      store?.subscribeWithSelector?.((state: any) => state?.messages, logSnapshot) ??
      store?.subscribe?.(logSnapshot);

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [channel]);

  if (!client || !channel) return null;

  const isMessageAIGenerated = (message: LocalMessage) =>
    !!(message as any).ai_generated ||
    message.user?.id === 'ai-bot-agent-lab';  

  const handleDebugSend = async () => {
    const ch: any = channel as any;

    const textComposer = ch?.messageComposer?.textComposer;
    if (!textComposer) {
      // eslint-disable-next-line no-console
      console.log('[ChatUI DebugSend] no textComposer on channel', ch);
      return;
    }

    try {
      const snapshot =
        textComposer.state?.getSnapshot?.() ??
        textComposer.state?.['_getSnapshot']?.();

      // eslint-disable-next-line no-console
      console.log('[ChatUI DebugSend] snapshot before submit:', snapshot);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ChatUI DebugSend] submit error', err);
    }
  };

  return (
    <Chat client={client as any} theme="messaging light">
      <ErrorBoundary>
        <Channel channel={channel as any}>
          <Window>
            <MessageList
              Message={(props: MessageProps) => (
                <AgentMessage
                  {...props}
                  currentUserId={(client as any)?.user?.id}
                />
              )}
            />
            <TypingIndicator />
            <AIStateIndicator />
            <MessageInput maxRows={6} minRows={1} />

            {/* Temporary debug control */}
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleDebugSend}
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
              >
                Debug send
              </button>
            </div>
          </Window>
        </Channel>
      </ErrorBoundary>
    </Chat>
  );
}
