import React from 'react';

export type LoadMoreButtonProps = {
  /** onClick handler load more button. Pagination logic should be executed in this handler. */
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  /** indicates whether a loading request is in progress */
  isLoading?: boolean;
  /**
   * @deprecated Use loading prop instead of refreshing. Planned for removal.
   */
  refreshing?: boolean;
  children?: React.ReactNode;
};

/** Placeholder implementation for Stream\'s LoadMoreButton component. */
export function LoadMoreButton({
  children,
  isLoading,
  onClick,
  refreshing,
}: React.PropsWithChildren<LoadMoreButtonProps>) {
  const loading = typeof isLoading !== 'undefined' ? isLoading : refreshing;
  return (
    <div className="str-chat__load-more-button">
      <button
        aria-label="Load more"
        className="str-chat__load-more-button__button str-chat__cta-button"
        data-testid="load-more-button"
        disabled={!!loading}
        onClick={onClick}
      >
        {loading ? 'Loading…' : children ?? 'Load more'}
      </button>
    </div>
  );
}

export default LoadMoreButton;
