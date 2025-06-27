import type React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { LocalMessage } from 'chat-shim';

export type UseScrollLocationLogicParams = {
  hasMoreNewer: boolean;
  listElement: HTMLDivElement | null;
  loadMoreScrollThreshold: number;
  suppressAutoscroll: boolean;
  messages?: LocalMessage[];
  scrolledUpThreshold?: number;
};

// Minimal placeholder for useMessageListScrollManager until implemented
function useMessageListScrollManager(
  _params: {
    loadMoreScrollThreshold: number;
    messages: LocalMessage[];
    onScrollBy: (scrollBy: number) => void;
    scrollContainerMeasures: () => { offsetHeight: number; scrollHeight: number };
    scrolledUpThreshold: number;
    scrollToBottom: () => void;
    showNewMessages: () => void;
  },
) {
  return (_scrollTop: number) => {
    /* no-op placeholder */
  };
}

/**
 * Lightweight replacement for Stream's `useScrollLocationLogic` hook.
 */
export const useScrollLocationLogic = (params: UseScrollLocationLogicParams) => {
  const {
    hasMoreNewer,
    listElement,
    loadMoreScrollThreshold,
    messages = [],
    scrolledUpThreshold = 200,
    suppressAutoscroll,
  } = params;

  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [wrapperRect, setWrapperRect] = useState<DOMRect>();

  const [isMessageListScrolledToBottom, setIsMessageListScrolledToBottom] =
    useState(true);
  const closeToBottom = useRef(false);
  const closeToTop = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (!listElement?.scrollTo || hasMoreNewer || suppressAutoscroll) {
      return;
    }

    listElement.scrollTo({ top: listElement.scrollHeight });
    setHasNewMessages(false);
  }, [listElement, hasMoreNewer, suppressAutoscroll]);

  useLayoutEffect(() => {
    if (listElement) {
      setWrapperRect(listElement.getBoundingClientRect());
      scrollToBottom();
    }
  }, [listElement, hasMoreNewer, scrollToBottom]);

  const updateScrollTop = useMessageListScrollManager({
    loadMoreScrollThreshold,
    messages,
    onScrollBy: (scrollBy) => {
      listElement?.scrollBy({ top: scrollBy });
    },
    scrollContainerMeasures: () => ({
      offsetHeight: listElement?.offsetHeight || 0,
      scrollHeight: listElement?.scrollHeight || 0,
    }),
    scrolledUpThreshold,
    scrollToBottom,
    showNewMessages: () => setHasNewMessages(true),
  });

  const onScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const element = event.target as HTMLDivElement;
      const scrollTop = element.scrollTop;

      updateScrollTop(scrollTop);

      const offsetHeight = element.offsetHeight;
      const scrollHeight = element.scrollHeight;

      const prevCloseToBottom = closeToBottom.current;
      closeToBottom.current =
        scrollHeight - (scrollTop + offsetHeight) < scrolledUpThreshold;
      closeToTop.current = scrollTop < scrolledUpThreshold;

      if (closeToBottom.current) {
        setHasNewMessages(false);
      }
      if (prevCloseToBottom && !closeToBottom.current) {
        setIsMessageListScrolledToBottom(false);
      } else if (!prevCloseToBottom && closeToBottom.current) {
        setIsMessageListScrolledToBottom(true);
      }
    },
    [updateScrollTop, scrolledUpThreshold],
  );

  return {
    hasNewMessages,
    isMessageListScrolledToBottom,
    onScroll,
    scrollToBottom,
    wrapperRect,
  };
};

export default useScrollLocationLogic;

