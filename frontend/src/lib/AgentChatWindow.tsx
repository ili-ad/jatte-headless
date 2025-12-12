'use client';

// Agent-only chat UI. Plain chat uses ChatWindow from ./ChatWindow.

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
import { StopAIGenerationButton } from '@iliad/stream-chat-shim';
import { useEffect } from 'react';

import { AgentMessage } from '../app/agent/AgentMessage';


import { useChat } from './ChatProvider';
import ErrorBoundary from './ErrorBoundary';
import ChatBootstrapNotice from './ChatBootstrapNotice';

export default function AgentChatWindow() {
  const { client, channel, bootstrapStatus, retryBootstrap } = useChat();

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

  useEffect(() => {
    if (!channel) return;
    // eslint-disable-next-line no-console
    console.log('[agent/ui] aiState in AgentChatWindow', {
      cid: (channel as any).cid,
      aiState,
      AIStates,
      isAgentBusy,
    });
  }, [aiState, isAgentBusy, channel]);


  const ready = client && channel && bootstrapStatus.kind === 'ready';

  if (!ready) {
    return <ChatBootstrapNotice status={bootstrapStatus} onRetry={retryBootstrap} />;
  }

  if (!client || !channel) return null;

  const handleStopAgent = async () => {
    if (!channel) return;

    const cid = (channel as any).cid as string | undefined;
    if (!cid) return;

    try {
      const response = await fetch(
        `/api/rooms/${encodeURIComponent(cid)}/agent/cancel/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok && response.status !== 204) {
        // eslint-disable-next-line no-console
        console.error('[agent/ui] failed to cancel agent run', {
          cid,
          status: response.status,
        });
      } else {
        // eslint-disable-next-line no-console
        console.log('[agent/ui] agent cancel requested', { cid });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[agent/ui] error while cancelling agent run', err);
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
                      // Agent is busy; ignore sends instead of causing a 409.
                      // eslint-disable-next-line no-console
                      console.warn('[agent/ui] blocked send while agent busy');
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
