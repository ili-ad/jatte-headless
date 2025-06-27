import { useState } from 'react';
import type { APIErrorResponse, ErrorFromResponse } from 'chat-shim';

/**
 * State tuple returned by useChannelsQueryState.
 * Mirrors the public API of stream-chat-react's hook but implements
 * minimal local state management only.
 */
type ChannelQueryState = 'uninitialized' | 'reload' | 'load-more' | null;

export interface ChannelsQueryState {
  error: ErrorFromResponse<APIErrorResponse> | null;
  queryInProgress: ChannelQueryState;
  setError: React.Dispatch<
    React.SetStateAction<ErrorFromResponse<APIErrorResponse> | null>
  >;
  setQueryInProgress: React.Dispatch<React.SetStateAction<ChannelQueryState>>;
}

/**
 * Lightweight shim for Stream's `useChannelsQueryState` hook.
 * It only exposes state setters and does not perform any query logic.
 */
export const useChannelsQueryState = (): ChannelsQueryState => {
  const [error, setError] = useState<ErrorFromResponse<APIErrorResponse> | null>(
    null,
  );
  const [queryInProgress, setQueryInProgress] = useState<ChannelQueryState>(null);

  return {
    error,
    queryInProgress,
    setError,
    setQueryInProgress,
  } as const;
};

export default useChannelsQueryState;
