import React from 'react';

// Placeholder type for VirtuosoContext from stream-chat-react
export interface VirtuosoContext {
  [key: string]: any;
}

export type CommonVirtuosoComponentProps = {
  context?: VirtuosoContext;
};

const PREPEND_OFFSET = 10 ** 7;

/**
 * Calculates the index of a message in the original message list based on
 * the position in the virtualized list.
 */
export function calculateItemIndex(
  virtuosoIndex: number,
  numItemsPrepended: number,
) {
  return virtuosoIndex + numItemsPrepended - PREPEND_OFFSET;
}

/**
 * Calculates the first item index for the virtual list given how many items
 * were prepended before the initial page.
 */
export function calculateFirstItemIndex(numItemsPrepended: number) {
  return PREPEND_OFFSET - numItemsPrepended;
}

/**
 * Creates a no-op handler for the `itemsRendered` callback.
 */
export const makeItemsRenderedHandler = (
  _renderedItemsActions: Array<(msg: any[]) => void>,
  _processedMessages: any[],
) => {
  return (_items: any[]) => {
    // noop placeholder
  };
};

/**
 * Minimal item wrapper used in the virtualized message list.
 */
export const Item = (
  props: React.HTMLAttributes<HTMLDivElement> & CommonVirtuosoComponentProps,
) => {
  return <div {...props} />;
};

/**
 * Renders the header for the virtualized message list.
 */
export const Header = ({ context }: CommonVirtuosoComponentProps) => {
  return <>{context?.head}</>;
};

/**
 * Placeholder component shown when there are no messages.
 */
export const EmptyPlaceholder = ({ context }: CommonVirtuosoComponentProps) => {
  if (context?.processedMessages?.length) return null;
  return <div data-testid="virtualized-message-list-empty" />;
};

/**
 * Default renderer for a message in the virtualized list.
 */
export const messageRenderer = (
  _index: number,
  _data: any,
  _context: VirtuosoContext,
) => <div data-testid="virtualized-message">VirtualizedMessage</div>;

