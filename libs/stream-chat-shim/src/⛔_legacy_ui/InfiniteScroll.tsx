import React, { PropsWithChildren } from 'react';

export type PaginatorProps = {
  loadNextPage: () => void;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  isLoading?: boolean;
  LoadingIndicator?: React.ComponentType<any>;
  loadPreviousPage?: () => void;
  refreshing?: boolean;
  reverse?: boolean;
  threshold?: number;
};

export type InfiniteScrollProps = PaginatorProps & {
  className?: string;
  element?: React.ElementType;
  /**
   * @deprecated Use hasPreviousPage instead.
   */
  hasMore?: boolean;
  /**
   * @deprecated Use hasNextPage instead.
   */
  hasMoreNewer?: boolean;
  head?: React.ReactNode;
  initialLoad?: boolean;
  listenToScroll?: (offset: number, reverseOffset: number, threshold: number) => void;
  loader?: React.ReactNode;
  /**
   * @deprecated Use loadPreviousPage instead.
   */
  loadMore?: () => void;
  /**
   * @deprecated Use loadNextPage instead.
   */
  loadMoreNewer?: () => void;
  loadNextPage?: () => void;
  loadPreviousPage?: () => void;
  useCapture?: boolean;
};

/**
 * Placeholder implementation of InfiniteScroll.
 * Renders children inside a wrapper element while real functionality is ported.
 */
export const InfiniteScroll = (
  props: PropsWithChildren<InfiniteScrollProps>
) => {
  const { children, element: Component = 'div', ..._rest } = props;
  return <Component data-testid="infinite-scroll-placeholder">{children}</Component>;
};

export default InfiniteScroll;
