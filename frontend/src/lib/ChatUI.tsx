'use client';

import {
  Chat,
  Channel,
  Window,
  MessageList,
  MessageInput,
} from '@iliad/stream-chat-shim';

import { useChat } from './ChatProvider';
import ErrorBoundary from './ErrorBoundary';

export default function ChatUI() {
  const { client, channel } = useChat();

  if (!client || !channel) return null;

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
            <MessageList />
            <MessageInput />

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
