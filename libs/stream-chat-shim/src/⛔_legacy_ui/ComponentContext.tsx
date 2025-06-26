import React, { createContext, useContext, PropsWithChildren } from 'react';

/**
 * Map of overridable UI components used by Stream UI.
 * This is a minimal placeholder for the real implementation.
 */
export interface ComponentContextValue {
  /** Optional emoji search index used by some inputs */
  emojiSearchIndex?: any;
  /** Arbitrary component mappings */
  [key: string]: React.ComponentType<any> | undefined;
}

export const ComponentContext = createContext<ComponentContextValue>({});

export const ComponentProvider: React.FC<
  PropsWithChildren<{ value: Partial<ComponentContextValue> }>
> = ({ value, children }) => (
  <ComponentContext.Provider value={value as ComponentContextValue}>
    {children}
  </ComponentContext.Provider>
);

/** Access the current ComponentContext. */
export const useComponentContext = () => useContext(ComponentContext);

export default ComponentContext;
