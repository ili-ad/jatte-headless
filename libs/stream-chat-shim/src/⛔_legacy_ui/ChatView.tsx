import React, { createContext, useContext, useEffect, PropsWithChildren } from 'react';

export type ThreadsViewContextValue = {
  activeThread: any | undefined;
  setActiveThread: (cv: ThreadsViewContextValue['activeThread']) => void;
};

const ThreadsViewContext = createContext<ThreadsViewContextValue>({
  activeThread: undefined,
  setActiveThread: () => {},
});

export const useThreadsViewContext = () => useContext(ThreadsViewContext);

export const useActiveThread = ({ activeThread }: { activeThread?: any }) => {
  useEffect(() => {
    // TODO: implement thread activation logic
  }, [activeThread]);
};

export const ChatView: React.FC<PropsWithChildren> & {
  Channels: React.FC<PropsWithChildren>;
  Threads: React.FC<PropsWithChildren>;
  ThreadAdapter: React.FC<PropsWithChildren>;
  Selector: React.FC;
} = ({ children }) => {
  return <div data-testid="chat-view">{children}</div>;
};

ChatView.Channels = ({ children }: PropsWithChildren<{}>) => (
  <div data-testid="chat-view-channels">{children}</div>
);

ChatView.Threads = ({ children }: PropsWithChildren<{}>) => (
  <div data-testid="chat-view-threads">{children}</div>
);

ChatView.ThreadAdapter = ({ children }: PropsWithChildren<{}>) => (
  <div data-testid="chat-view-thread-adapter">{children}</div>
);

ChatView.Selector = () => <div data-testid="chat-view-selector" />;

export default ChatView;
