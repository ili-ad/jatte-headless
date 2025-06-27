import React, { createContext, useContext, type PropsWithChildren } from 'react';
import type { Thread } from 'chat-shim';

export type ThreadContextValue = Thread | undefined;

export const ThreadContext = createContext<ThreadContextValue>(undefined);

export const useThreadContext = () => useContext(ThreadContext);

export const ThreadProvider = ({ children, thread }: PropsWithChildren<{ thread?: Thread }>) => (
  <ThreadContext.Provider value={thread}>{children}</ThreadContext.Provider>
);

export default ThreadContext;
