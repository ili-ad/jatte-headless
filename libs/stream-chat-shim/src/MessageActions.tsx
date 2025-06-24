import React from 'react';
import type { MESSAGE_ACTIONS } from './message-utils';

export type MessageActionSetItem = {
  Component: React.ComponentType<any>;
  placement: 'quick' | 'dropdown';
  type: keyof typeof MESSAGE_ACTIONS | (string & {});
};

export type MessageActionsProps = {
  disableBaseMessageActionSetFilter?: boolean;
  messageActionSet?: MessageActionSetItem[];
};

/** Placeholder implementation of Stream's MessageActions component. */
export const MessageActions = (_props: MessageActionsProps) => {
  return <div className="str-chat__message-actions">MessageActions</div>;
};

export default MessageActions;
