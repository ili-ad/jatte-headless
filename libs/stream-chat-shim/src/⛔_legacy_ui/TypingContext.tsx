import React, { useContext, type PropsWithChildren } from 'react';
import type { ChannelState as StreamChannelState } from 'chat-shim';

// Placeholder type matching Stream Chat React's generic utility
export type UnknownType = any;

export type TypingContextValue = {
  typing?: StreamChannelState['typing'];
};

export const TypingContext = React.createContext<TypingContextValue | undefined>(
  undefined,
);

export const TypingProvider = ({
  children,
  value,
}: PropsWithChildren<{ value: TypingContextValue }>) => (
  <TypingContext.Provider value={value}>{children}</TypingContext.Provider>
);

export const useTypingContext = (componentName?: string) => {
  const contextValue = useContext(TypingContext);

  if (!contextValue) {
    console.warn(
      `The useTypingContext hook was called outside of the TypingContext provider. Make sure this hook is called within a child of the Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as TypingContextValue;
  }

  return contextValue;
};

/**
 * Typescript currently does not support partial inference, so if TypingContext typing is desired while using the HOC withTypingContext,
 * the Props for the wrapped component must be provided as the first generic.
 */
export const withTypingContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
) => {
  const WithTypingContextComponent = (
    props: Omit<P, keyof TypingContextValue>,
  ) => {
    const typingContext = useTypingContext();
    return <Component {...(props as P)} {...typingContext} />;
  };

  WithTypingContextComponent.displayName = (
    Component.displayName || Component.name || 'Component'
  ).replace('Base', '');

  return WithTypingContextComponent;
};
