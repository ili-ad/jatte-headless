import type { ReactEventHandler } from 'react';
import React, { createContext, useContext } from 'react';
import type { LocalMessage } from 'chat-shim';

export interface MessageBounceContextValue {
  handleDelete: ReactEventHandler;
  handleEdit: ReactEventHandler;
  handleRetry: ReactEventHandler;
  message: LocalMessage;
}

const defaultValue: MessageBounceContextValue = {
  handleDelete: () => {
    throw new Error('handleDelete not implemented');
  },
  handleEdit: () => {
    throw new Error('handleEdit not implemented');
  },
  handleRetry: () => {
    throw new Error('handleRetry not implemented');
  },
  message: undefined as unknown as LocalMessage,
};

const MessageBounceContext = createContext<MessageBounceContextValue>(defaultValue);

/**
 * Shim implementation of Stream's `useMessageBounceContext` hook.
 */
export const useMessageBounceContext = (componentName?: string): MessageBounceContextValue => {
  const contextValue = useContext(MessageBounceContext);

  if (contextValue === defaultValue) {
    console.warn(
      `The useMessageBounceContext hook was called outside of the MessageBounceContext provider.` +
        (componentName ? ` The errored call is located in the ${componentName} component.` : ''),
    );
  }

  return contextValue;
};

/**
 * Shim implementation of the `MessageBounceProvider` component.
 */
export const MessageBounceProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <MessageBounceContext.Provider value={defaultValue}>
      {children}
    </MessageBounceContext.Provider>
  );
};

export default MessageBounceContext;
