import React, { useContext } from 'react';
import type { LocalMessage } from 'chat-shim';

/**
 * LegacyThreadContext provides access to the currently active thread message.
 */
export const LegacyThreadContext = React.createContext<{
  legacyThread: LocalMessage | undefined;
}>({ legacyThread: undefined });

/**
 * Hook to access the LegacyThreadContext.
 */
export const useLegacyThreadContext = () => useContext(LegacyThreadContext);
