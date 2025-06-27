import React, { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { useChannelStateContext } from '../../context/ChannelStateContext';
// import type { LocalMessage } from 'stream-chat'; // TODO backend-wire-up
type LocalMessage = any;

export type WindowProps = {
  /** optional prop to force addition of class str-chat__main-panel--thread-open to the Window root element */
  thread?: LocalMessage;
};

/**
 * A UI component for conditionally displaying a Thread or Channel
 */
const UnMemoizedWindow = (props: PropsWithChildren<WindowProps>) => {
  const { children, thread: propThread } = props;
  const { thread: contextThread } = useChannelStateContext('Window');

  return (
    <div
      className={clsx('str-chat__main-panel', {
        'str-chat__main-panel--thread-open': contextThread || propThread,
      })}
    >
      {children}
    </div>
  );
};

export const Window = React.memo(UnMemoizedWindow);
