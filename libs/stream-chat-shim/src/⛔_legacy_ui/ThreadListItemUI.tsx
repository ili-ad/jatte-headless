import React from 'react';
import type { ComponentPropsWithoutRef } from 'react';

export type ThreadListItemUIProps = ComponentPropsWithoutRef<'button'>;

/** Placeholder implementation of the ThreadListItemUI component. */
export const ThreadListItemUI = ({ children, ...rest }: ThreadListItemUIProps) => {
  return (
    <button data-testid="thread-list-item-ui-placeholder" type="button" {...rest}>
      {children || 'ThreadListItemUI'}
    </button>
  );
};

export default ThreadListItemUI;
