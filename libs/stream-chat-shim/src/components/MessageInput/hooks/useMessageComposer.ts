import { useEffect, useMemo } from 'react';
import { FixedSizeQueueCache, MessageComposer } from 'chat-shim';
import { useThreadContext } from '../../Threads';
import {
  useChannelStateContext,
  useChatContext,
  useMessageContext,
} from '../../../context';
import { useLegacyThreadContext } from '../../Thread';

const queueCache = new FixedSizeQueueCache<string, MessageComposer>(64);

export const useMessageComposer = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const { editing, message: editedMessage } = useMessageContext();
  // legacy thread will receive new composer
  const { legacyThread: parentMessage } = useLegacyThreadContext();
  const threadInstance = useThreadContext();

  const cachedEditedMessage = useMemo(() => {
    if (!editedMessage) return undefined;

    return editedMessage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedMessage?.id]);

  const cachedParentMessage = useMemo(() => {
    if (!parentMessage) return undefined;

    return parentMessage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentMessage?.id]);

  // composer hierarchy
  // edited message (always new) -> thread instance (own) -> thread message (always new) -> channel (own)
  // editedMessage ?? thread ?? parentMessage ?? channel;
  // const messageComposer = useMemo(() => {
  //   if (editing && cachedEditedMessage) {
  //     const tag = MessageComposer.constructTag(cachedEditedMessage);

  //     const cachedComposer = queueCache.get(tag);
  //     if (cachedComposer) return cachedComposer;

  //     return new MessageComposer({
  //       client,
  //       composition: cachedEditedMessage,
  //       compositionContext: cachedEditedMessage,
  //     });
  //   } else if (threadInstance) {
  //     return threadInstance.messageComposer;
  //   } else if (cachedParentMessage) {
  //     const compositionContext = {
  //       ...cachedParentMessage,
  //       legacyThreadId: cachedParentMessage.id,
  //     };

  //     const tag = MessageComposer.constructTag(compositionContext);

  //     const cachedComposer = queueCache.get(tag);
  //     if (cachedComposer) return cachedComposer;

  //     return new MessageComposer({
  //       client,
  //       compositionContext,
  //     });
  //   } else {
  //     return channel.messageComposer;
  //   }
  // }, [
  //   cachedEditedMessage,
  //   cachedParentMessage,
  //   channel,
  //   client,
  //   editing,
  //   threadInstance,
  // ]);


  // -------------------------------------------------------------------
  // build or reuse the correct MessageComposer instance
  // -------------------------------------------------------------------
  const messageComposer = useMemo(() => {
    if (editing && cachedEditedMessage) {
      const tag = MessageComposer.constructTag(cachedEditedMessage);

      const fromCache = queueCache.get(tag);
      if (fromCache) return fromCache;

      return new MessageComposer({
        client,
        composition: cachedEditedMessage,
        compositionContext: cachedEditedMessage,
      });
    }

    if (threadInstance) {
      return threadInstance.messageComposer;
    }

    if (cachedParentMessage) {
      const compositionContext = {
        ...cachedParentMessage,
        legacyThreadId: cachedParentMessage.id,
      };

      const tag = MessageComposer.constructTag(compositionContext);
      const fromCache = queueCache.get(tag);
      if (fromCache) return fromCache;

      return new MessageComposer({ client, compositionContext });
    }

    // fall-back: plain channel composer
    return channel.messageComposer;
  }, [
    cachedEditedMessage,
    cachedParentMessage,
    channel,
    client,
    editing,
    threadInstance,
  ]);

  // -------------------------------------------------------------------
  // **PATCH** – guarantee every manager has a `.state.getLatestValue`
  // so useStateStore() never crashes.
  // -------------------------------------------------------------------
  const noopStore = {
    getLatestValue: () => undefined,
    subscribe: () => () => {},
  };

  const ensureStore = (mgr: any) => {
    if (mgr && (!mgr.state?.getLatestValue || !mgr.state?.subscribe)) {
      mgr.state = noopStore;
    }
  };

  ensureStore(messageComposer);                     // the composer itself
  ensureStore((messageComposer as any).textComposer);
  ensureStore((messageComposer as any).attachmentManager);
  ensureStore((messageComposer as any).linkPreviewsManager);
  ensureStore((messageComposer as any).pollComposer);
  ensureStore((messageComposer as any).customDataManager);
  // -------------------------------------------------------------------


  if (
    (['legacy_thread', 'message'] as MessageComposer['contextType'][]).includes(
      messageComposer.contextType,
    ) &&
    !queueCache.peek(messageComposer.tag)
  ) {
    queueCache.add(messageComposer.tag, messageComposer);
  }

  useEffect(() => {
    const unsubscribe = messageComposer.registerSubscriptions();
    return () => {
      unsubscribe();
    };
  }, [messageComposer]);

  return messageComposer;
};
