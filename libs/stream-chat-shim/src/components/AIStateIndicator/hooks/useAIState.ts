import { useEffect, useMemo, useState } from 'react';
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
  const client = useMemo(
    () => (channel as { client?: { getAIState?: (cid: string) => AIState } } | undefined)?.client,
    [channel],
  );
  const cid = channel?.cid;
  const [aiState, setAiState] = useState<AIState>(() =>
    cid ? client?.getAIState?.(cid) ?? AIStates.Idle : AIStates.Idle,
  );

  useEffect(() => {
    if (!channel || !cid) return;

    const applyAIState = (state?: AIState) => setAiState(state ?? AIStates.Idle);

    const initial = client?.getAIState?.(cid);
    if (initial !== undefined) {
      applyAIState(initial);
    }

    const indicatorChangedListener = on(
      channel,
      'ai_indicator.update',
      (event) => {
        const state = event.ai_state as AIState | undefined;
        if (channel.cid === event.cid && state) {
          applyAIState(state);
        }
      },
    );

    const indicatorClearedListener = on(channel, 'ai_indicator.clear', (event) => {
      if (channel.cid === event.cid) {
        applyAIState(AIStates.Idle);
      }
    });

    const clientUpdateHandler = (event: { cid?: string; ai_state?: AIState }) => {
      if (event.cid === cid) {
        applyAIState(event.ai_state ?? client?.getAIState?.(cid));
      }
    };

    client?.on?.('ai_indicator.update', clientUpdateHandler as any);
    client?.on?.('ai_indicator.clear', clientUpdateHandler as any);

    return () => {
      indicatorChangedListener.unsubscribe();
      indicatorClearedListener.unsubscribe();
      client?.off?.('ai_indicator.update', clientUpdateHandler as any);
      client?.off?.('ai_indicator.clear', clientUpdateHandler as any);
    };
  }, [channel, cid, client]);

  return { aiState };
};
