import React, { useEffect } from "react";
import type { ComputeItemKey, VirtuosoProps } from "react-virtuoso";
import { Virtuoso } from "react-virtuoso";

import type { Thread, ThreadManagerState } from "chat-shim";

import { ThreadListItem as DefaultThreadListItem } from "./ThreadListItem";
import { ThreadListEmptyPlaceholder as DefaultThreadListEmptyPlaceholder } from "./ThreadListEmptyPlaceholder";
import { ThreadListUnseenThreadsBanner as DefaultThreadListUnseenThreadsBanner } from "./ThreadListUnseenThreadsBanner";
import { ThreadListLoadingIndicator as DefaultThreadListLoadingIndicator } from "./ThreadListLoadingIndicator";
import { useChatContext, useComponentContext } from "../../../context";
import { useStateStore } from "../../../store";
import { clientThreadsState } from "../../../chatSDKShim";
import {
  clientThreadsDeactivate,
  clientThreadsLoadNextPage,
} from "../../../chatSDKShim";

const selector = (nextValue: ThreadManagerState) => ({
  threads: nextValue.threads,
});

const computeItemKey: ComputeItemKey<Thread, unknown> = (_, item) => item.id;

type ThreadListProps = {
  virtuosoProps?: VirtuosoProps<Thread, unknown>;
};

export const useThreadList = () => {
  const { client } = useChatContext();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        client.threads.activate();
      }
      if (document.visibilityState === "hidden") {
        clientThreadsDeactivate(client);
      }
    };

    handleVisibilityChange();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clientThreadsDeactivate(client);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [client]);
};

export const ThreadList = ({ virtuosoProps }: ThreadListProps) => {
  const { client } = useChatContext();
  const {
    ThreadListEmptyPlaceholder = DefaultThreadListEmptyPlaceholder,
    ThreadListItem = DefaultThreadListItem,
    ThreadListLoadingIndicator = DefaultThreadListLoadingIndicator,
    ThreadListUnseenThreadsBanner = DefaultThreadListUnseenThreadsBanner,
  } = useComponentContext();
  const { threads } = useStateStore(clientThreadsState(client), selector);

  useThreadList();

  return (
    <div className="str-chat__thread-list-container">
      {/* TODO: allow re-load on stale ThreadManager state */}
      <ThreadListUnseenThreadsBanner />
      <Virtuoso
        atBottomStateChange={(atBottom) =>
          atBottom && clientThreadsLoadNextPage(client)
        }
        className="str-chat__thread-list"
        components={{
          EmptyPlaceholder: ThreadListEmptyPlaceholder,
          Footer: ThreadListLoadingIndicator,
        }}
        computeItemKey={computeItemKey}
        data={threads}
        itemContent={(_, thread) => <ThreadListItem thread={thread} />}
        // TODO: handle visibility (for a button that scrolls to the unread thread)
        // itemsRendered={(items) => console.log({ items })}
        {...virtuosoProps}
      />
    </div>
  );
};
