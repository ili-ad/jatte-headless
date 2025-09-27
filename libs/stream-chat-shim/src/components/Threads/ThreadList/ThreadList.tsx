import React, { useEffect } from "react";
import type { ComputeItemKey, VirtuosoProps } from "react-virtuoso";
import { Virtuoso } from "react-virtuoso";

import { StateStore } from "chat-shim";
import type { Thread, ThreadManagerState } from "chat-shim";

import { ThreadListItem as DefaultThreadListItem } from "./ThreadListItem";
import { ThreadListEmptyPlaceholder as DefaultThreadListEmptyPlaceholder } from "./ThreadListEmptyPlaceholder";
import { ThreadListUnseenThreadsBanner as DefaultThreadListUnseenThreadsBanner } from "./ThreadListUnseenThreadsBanner";
import { ThreadListLoadingIndicator as DefaultThreadListLoadingIndicator } from "./ThreadListLoadingIndicator";
import { useChatContext, useComponentContext } from "../../../context";
import {
  chatAPI,
  clientThreadsState as fetchClientThreadsState,
} from "../../../api/chatAPI";
import type { ThreadPreview, ThreadPreviewMessage } from "../../../api/chatAPI";
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

const toSafeDate = (value: string): Date => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }
  return date;
};

const toLocalMessage = (message: ThreadPreviewMessage, cid?: string) => {
  const createdAt = toSafeDate(message.created_at);
  const local: Record<string, unknown> = {
    id: message.id,
    cid: cid ?? "",
    type: "regular",
    status: "received",
    text: message.text,
    html: message.text,
    body: message.text,
    created_at: createdAt,
    updated_at: createdAt,
    attachments: [],
    latest_reactions: [],
    own_reactions: [],
    reaction_groups: {},
    user: { id: message.sent_by, name: message.sent_by },
    user_id: message.sent_by,
  };

  if (message.deleted_at) {
    const deletedAt = new Date(message.deleted_at);
    local.deleted_at = Number.isNaN(deletedAt.getTime())
      ? message.deleted_at
      : deletedAt;
  }

  return local;
};

const createThreadFromPreview = ({
  preview,
  channel,
  currentUserId,
}: {
  preview: ThreadPreview;
  channel?: Thread["channel"];
  currentUserId?: string;
}): Thread => {
  const cid = channel?.cid;
  const parentMessage = toLocalMessage(preview.parent, cid);
  const replies = preview.replies.length
    ? preview.replies.map((reply) => toLocalMessage(reply, cid))
    : [parentMessage];

  const readState =
    currentUserId !== undefined
      ? {
          [currentUserId]: {
            unreadMessageCount: 0,
          },
        }
      : {};

  const state = new StateStore({
    channel,
    deletedAt: preview.parent.deleted_at ?? null,
    parentMessage,
    replies,
    read: readState,
    pagination: { isLoadingNext: false, isLoadingPrev: false },
  });

  return {
    id: preview.id,
    channel,
    state,
    activate: () => {},
    deactivate: () => {},
    loadNextPage: async () => {},
    loadPrevPage: async () => {},
  } as Thread;
};

const setThreadManagerLoading = (
  store: StateStore<ThreadManagerState>,
  isLoading: boolean,
) => {
  const snapshot = store.getLatestValue?.();
  const pagination = {
    ...(snapshot?.pagination ?? {}),
    isLoadingNext: isLoading,
  };
  store.dispatch({ pagination });
};

type ThreadListProps = {
  virtuosoProps?: VirtuosoProps<Thread, unknown>;
};

export const useThreadList = () => {
  const { client } = useChatContext();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        chatAPI.clientThreadsActivate({ client });
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
  const { client, channel } = useChatContext();
  const {
    ThreadListEmptyPlaceholder = DefaultThreadListEmptyPlaceholder,
    ThreadListItem = DefaultThreadListItem,
    ThreadListLoadingIndicator = DefaultThreadListLoadingIndicator,
    ThreadListUnseenThreadsBanner = DefaultThreadListUnseenThreadsBanner,
  } = useComponentContext();
  const threadManagerStore = clientThreadsState(client);
  const { threads } = useStateStore(threadManagerStore, selector);

  useThreadList();

  useEffect(() => {
    let cancelled = false;
    const cid = channel?.cid;

    if (!cid) {
      threadManagerStore.dispatch({
        threads: [],
        unseenThreadIds: [],
        unreadThreadCount: 0,
        pagination: { isLoadingNext: false, isLoadingPrev: false, nextCursor: null },
      });
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      setThreadManagerLoading(threadManagerStore, true);
      try {
        const response = await fetchClientThreadsState({ cid });
        if (cancelled) return;

        const rawUserId = client.user?.id;
        const currentUserId =
          typeof rawUserId === "string"
            ? rawUserId
            : rawUserId != null
              ? String(rawUserId)
              : undefined;

        const nextThreads = response.threads.map((preview) =>
          createThreadFromPreview({
            preview,
            channel,
            currentUserId,
          }),
        );

        threadManagerStore.dispatch({
          threads: nextThreads,
          unseenThreadIds: response.unseenThreadIds,
          unreadThreadCount: response.unreadThreadCount,
          pagination: {
            isLoadingNext: false,
            isLoadingPrev: false,
            nextCursor: response.next ? String(response.next) : null,
          },
        });
      } catch (error) {
        if (!cancelled) {
          setThreadManagerLoading(threadManagerStore, false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [channel?.cid, channel, client, threadManagerStore]);

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
