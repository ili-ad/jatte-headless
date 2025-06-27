import React, { useContext } from 'react';
/* TODO backend-wire-up: LocalMessage import excised */
type LocalMessage = any;

export const LegacyThreadContext = React.createContext<{
  legacyThread: LocalMessage | undefined;
}>({ legacyThread: undefined });

export const useLegacyThreadContext = () => useContext(LegacyThreadContext);
