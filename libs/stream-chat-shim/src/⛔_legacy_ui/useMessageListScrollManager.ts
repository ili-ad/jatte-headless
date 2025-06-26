import { useLayoutEffect, useRef } from 'react';
import type { LocalMessage } from 'stream-chat';

export type ContainerMeasures = {
  offsetHeight: number;
  scrollHeight: number;
};

export type UseMessageListScrollManagerParams = {
  loadMoreScrollThreshold: number;
  messages: LocalMessage[];
  onScrollBy: (scrollBy: number) => void;
  scrollContainerMeasures: () => ContainerMeasures;
  scrolledUpThreshold: number;
  scrollToBottom: () => void;
  showNewMessages: () => void;
};

/**
 * Placeholder implementation of Stream's `useMessageListScrollManager` hook.
 * Currently does not adjust scroll position.
 */
export function useMessageListScrollManager(
  _params: UseMessageListScrollManagerParams,
): (scrollTopValue: number) => void {
  const scrollTop = useRef(0);

  useLayoutEffect(() => {
    // TODO: implement scroll management logic
  }, [_params]);

  return (scrollTopValue: number) => {
    scrollTop.current = scrollTopValue;
  };
}

export default useMessageListScrollManager;
