import { useEffect, useState } from 'react';
import type { AIState, Channel, Event } from 'chat-shim';

/** States reported by the AI back-end */
export const AIStates = {
  Error: 'AI_STATE_ERROR',
  ExternalSources: 'AI_STATE_EXTERNAL_SOURCES',
  Generating: 'AI_STATE_GENERATING',
  Idle: 'AI_STATE_IDLE',
  Thinking: 'AI_STATE_THINKING',
} as const;

/**
 * React hook that tracks AI state events on a channel.
 *
 * @param channel - The channel for which the AI state should be tracked.
 * @returns The latest AI state for the channel.
 */
export const useAIState = (channel?: Channel) => {
  const [aiState, setAiState] = useState<AIState>(AIStates.Idle as unknown as AIState);

  useEffect(() => {
    if (!channel) return;

    const indicatorChangedListener = channel.on('ai_indicator.update', (event: Event) => {
      const { cid } = event as any;
      const state = (event as any).ai_state as AIState;
      if (channel.cid === cid) {
        setAiState(state);
      }
    });

    const indicatorClearedListener = channel.on('ai_indicator.clear', (event: Event) => {
      const { cid } = event as any;
      if (channel.cid === cid) {
        setAiState(AIStates.Idle as unknown as AIState);
      }
    });

    return () => {
      indicatorChangedListener.unsubscribe();
      indicatorClearedListener.unsubscribe();
    };
  }, [channel]);

  return { aiState };
};
