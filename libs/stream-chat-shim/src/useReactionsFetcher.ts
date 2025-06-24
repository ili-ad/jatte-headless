import { useCallback, useState } from 'react';
import type { StreamChat } from 'stream-chat';

export type UseReactionsFetcherParams = {
  client: StreamChat;
  messageId: string;
};

export type UseReactionsFetcherResult = {
  reactions: any[];
  hasNextPage: boolean;
  fetching: boolean;
  fetchNextPage: () => Promise<void>;
  setReactions: React.Dispatch<React.SetStateAction<any[]>>;
};

/**
 * Placeholder implementation of Stream's `useReactionsFetcher` hook.
 * It mirrors the public API but does not perform any network requests.
 */
export const useReactionsFetcher = (
  _params: UseReactionsFetcherParams,
): UseReactionsFetcherResult => {
  const [reactions, setReactions] = useState<any[]>([]);
  const [hasNextPage] = useState(true);
  const [fetching, setFetching] = useState(false);

  const fetchNextPage = useCallback(async () => {
    setFetching(true);
    // TODO: integrate with Stream Chat client
    setFetching(false);
    throw new Error('useReactionsFetcher not implemented');
  }, []);

  return { reactions, hasNextPage, fetching, fetchNextPage, setReactions };
};

export default useReactionsFetcher;
