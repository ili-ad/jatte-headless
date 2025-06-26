import type { PropsWithChildren } from 'react';
import React from 'react';
import type { LocalMessage } from 'stream-chat';

/**
 * Placeholder implementation of the Window component.
 * It simply renders its children.
 */
export type WindowProps = {
  /** optional prop to force thread styling */
  thread?: LocalMessage;
};

export const Window = (props: PropsWithChildren<WindowProps>) => {
  const { children } = props;
  return <div data-testid="window">{children}</div>;
};

export default Window;
