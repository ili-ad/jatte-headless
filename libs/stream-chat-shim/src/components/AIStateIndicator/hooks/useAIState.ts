import { useEffect, useState } from 'react';
import type { AIState, Channel } from 'chat-shim';
import { on } from '../../../chatSDKShim';

export const AIStates = {
  Error: 'AI_STATE_ERROR',
  ExternalSources: 'AI_STATE_EXTERNAL_SOURCES',
  Generating: 'AI_STATE_GENERATING',
  Idle: 'AI_STATE_IDLE',
  Thinking: 'AI_STATE_THINKING',
};

/**
 * A hook that returns the current state of the AI.
 * @param {Channel} channel - The channel for which we want to know the AI state.
 * @returns {{ aiState: AIState }} The current AI state for the given channel.
 */
export const useAIState = (channel?: Channel): { aiState: AIState } => {
  const [aiState, setAiState] = useState<AIState>(AIStates.Idle);

  useEffect(() => {
    if (!channel) {
      return;
    }

    const indicatorChangedListener = on(
      channel,
      'ai_indicator.update',
      (event) => {
        const { cid } = event;
        const state = event.ai_state as AIState | undefined;
        if (channel.cid === cid && state) {
          setAiState(state);
        }
      },
    );

    const indicatorClearedListener = on(channel, 'ai_indicator.clear', (event) => {
      const { cid } = event;
      if (channel.cid === cid) {
        setAiState(AIStates.Idle);
      }
    });

    return () => {
      indicatorChangedListener.unsubscribe();
      indicatorClearedListener.unsubscribe();
    };
  }, [channel]);

  return { aiState };
};
