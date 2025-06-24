import { useEffect, useState } from 'react';
import type { ReactionResponse, ReactionSort } from 'stream-chat';

// Placeholder type for reaction types from Stream Chat
export type ReactionType = string;

export interface FetchReactionsOptions {
  reactionType: ReactionType;
  shouldFetch: boolean;
  handleFetchReactions?: (
    type: ReactionType,
    sort?: ReactionSort,
  ) => Promise<ReactionResponse[]>;
  sort?: ReactionSort;
}

/**
 * Simplified shim for Stream's `useFetchReactions` hook.
 * It mimics the public API without performing any real network calls.
 */
export function useFetchReactions(options: FetchReactionsOptions) {
  const {
    handleFetchReactions,
    reactionType,
    shouldFetch,
    sort,
  } = options;
  const [reactions, setReactions] = useState<ReactionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(shouldFetch);

  useEffect(() => {
    if (!shouldFetch) return;
    let cancel = false;
    (async () => {
      try {
        setIsLoading(true);
        const fetched = await handleFetchReactions?.(reactionType, sort);
        if (!cancel && fetched) {
          setReactions(fetched);
        }
      } catch (_e) {
        if (!cancel) {
          setReactions([]);
        }
      } finally {
        if (!cancel) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [handleFetchReactions, reactionType, shouldFetch, sort]);

  return { isLoading, reactions };
}

export default useFetchReactions;
