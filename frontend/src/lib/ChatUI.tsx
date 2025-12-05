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
  AIStates,
  useAIState,
} from '@iliad/stream-chat-shim';
import { useEffect } from 'react';
import { StopAIGenerationButton } from '@iliad/stream-chat-shim/src/components/MessageInput/StopAIGenerationButton';

import type { LocalMessage } from 'chat-shim';
import { AgentMessage } from '@/app/agent/AgentMessage';
import { AgentAIStateBanner } from '@/app/agent/AgentAIStateBanner';

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

  const { aiState } = useAIState(channel as any);

  const isAgentBusy = aiState === AIStates.Thinking || aiState === AIStates.Generating;

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

  const handleStopAgent = () => {
    // Future: call backend cancel endpoint.
    // For now, just log so we can see it’s wired correctly.
    // eslint-disable-next-line no-console
    console.log('[agent/ui] stop AI generation clicked', { cid: channel?.cid });
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
            <AgentAIStateBanner channel={channel as any} />
            <div
              className="chat-footer-status-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 16px',
                minHeight: 28,
              }}
            >
              {isAgentBusy && <StopAIGenerationButton onClick={handleStopAgent} />}
              <AIStateIndicator />
            </div>
            <MessageInput
              maxRows={6}
              minRows={1}
              hideSendButton={isAgentBusy}
              additionalTextareaProps={{
                disabled: isAgentBusy,
              }}
              overrideSubmitHandler={
                isAgentBusy
                  ? () => {
                      return;
                    }
                  : undefined
              }
            />
          </Window>
        </Channel>
      </ErrorBoundary>
    </Chat>
  );
}
