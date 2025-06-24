import React, { createContext, useContext, PropsWithChildren } from 'react';

// Placeholder type definitions mirroring those from stream-chat-react
// These will be replaced with real types once the upstream code is migrated.
export type MessageContextValue = any;

export const MessageContext = createContext<MessageContextValue | undefined>(
  undefined,
);

export const MessageProvider = (
  { children, value }: PropsWithChildren<{ value: MessageContextValue }>,
) => (
  <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
);

export const useMessageContext = () => {
  const contextValue = useContext(MessageContext);
  if (!contextValue) return {} as MessageContextValue;
  return contextValue;
};

export const withMessageContext = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
) => {
  const WithMessageContextComponent = (
    props: Omit<P, keyof MessageContextValue>,
  ) => {
    const messageContext = useMessageContext();
    return <Component {...(props as P)} {...messageContext} />;
  };

  WithMessageContextComponent.displayName = (
    Component.displayName || Component.name || 'Component'
  ).replace('Base', '');

  return WithMessageContextComponent;
};
