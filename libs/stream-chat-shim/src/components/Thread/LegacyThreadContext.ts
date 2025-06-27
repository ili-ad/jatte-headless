import React, { useContext } from 'react';
import type { LocalMessage } from 'chat-shim';

export const LegacyThreadContext = React.createContext<{
  legacyThread: LocalMessage | undefined;
}>({ legacyThread: undefined });

export const useLegacyThreadContext = () => useContext(LegacyThreadContext);
