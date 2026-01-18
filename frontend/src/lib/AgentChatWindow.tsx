'use client';

// Agent-only chat UI. Plain chat uses ChatWindow from ./ChatWindow.

import type { AvatarProps, MessageProps } from '@iliad/stream-chat-shim';
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
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';

import { AgentMessage } from '../app/agent/AgentMessage';


import { useChat } from './ChatProvider';
import ErrorBoundary from './ErrorBoundary';
import ChatBootstrapNotice from './ChatBootstrapNotice';
import { getBotUserIdForChannel } from './stream-adapter/channelAgentExtensions';

type AgentChatWindowProps = {
  Avatar?: ComponentType<AvatarProps>;
};

function useStreamChatThemeClass() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains('dark'));
    update();

    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // IMPORTANT:
  // - Our CSS bundle (stream-chat-shim v2) defines theme variables on `.str-chat__theme-dark` / `.str-chat__theme-light`.
  // - Stream's newer "messaging dark/light" classes alone won't change colors unless your CSS contains those selectors.
  return isDark
    ? 'messaging dark str-chat__theme-dark'
    : 'messaging light str-chat__theme-light';
}

export default function AgentChatWindow({ Avatar }: AgentChatWindowProps) {
  const { client, channel, bootstrapStatus, retryBootstrap } = useChat();

  const streamTheme = useStreamChatThemeClass();
  useEffect(() => {
    if (!channel) return undefined;

    const botUserId = getBotUserIdForChannel(channel as any);
    const store: any = (channel as any).stateStore;
    const logSnapshot = () => {
      try {
        const snapshot = store?.getSnapshot?.();
        if (snapshot && process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log('[agent/ui] messages snapshot', snapshot.messages);

          const messages: any[] = snapshot.messages ?? [];
          const aiMessages = messages.filter((m) => {
            const uid = m?.user?.id ?? m?.user_id ?? m?.sent_by;
            return (
              (botUserId && uid === botUserId) ||
              Boolean((m as any).custom_data?.ai_generated)
            );
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

  const botUserId = channel ? getBotUserIdForChannel(channel as any) : null;

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
    <Chat client={client as any} theme={streamTheme} key={streamTheme}>
      <ErrorBoundary>
        <Channel channel={channel as any} Avatar={Avatar}>
          <Window>
            <MessageList
              Message={(props: MessageProps) => (
                <AgentMessage
                  {...props}
                  currentUserId={(client as any)?.user?.id}
                  botUserId={botUserId}
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
