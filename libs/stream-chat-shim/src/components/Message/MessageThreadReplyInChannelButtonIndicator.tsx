import React, { useEffect, useRef } from 'react';
import type { LocalMessage } from 'chat-shim';
import {
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';
import { chatAPI } from '../../api/chatAPI';

export const MessageThreadReplyInChannelButtonIndicator = () => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { channel } = useChannelStateContext();
  const { openThread } = useChannelActionContext();
  const { message } = useMessageContext();
  const parentMessageRef = useRef<LocalMessage | null | undefined>(undefined);

  const normalizeParentMessage = async (
    raw: unknown,
  ): Promise<LocalMessage | undefined> => {
    const state = channel?.state;
    if (!state || !raw) return undefined;

    const candidate =
      raw && typeof raw === 'object' && 'message' in (raw as { message?: unknown })
        ? (raw as { message?: unknown }).message
        : raw;

    if (!candidate) return undefined;

    const loader = (state as { loadMessageIntoState?: (value: unknown) => Promise<unknown> })
      .loadMessageIntoState;
    if (typeof loader === 'function') {
      try {
        return (await loader(candidate)) as LocalMessage;
      } catch (error) {
        console.error(error);
        return undefined;
      }
    }

    if (candidate && typeof candidate === 'object') {
      if (channel?.cid) {
        const existingCid = (candidate as { cid?: unknown }).cid;
        if (typeof existingCid !== 'string' || !existingCid) {
          return {
            ...(candidate as Record<string, unknown>),
            cid: channel.cid,
          } as LocalMessage;
        }
      }
      return candidate as LocalMessage;
    }

    return undefined;
  };

  const querySearchParent = async () => {
    try {
      const cid = channel?.cid;
      if (!cid || !message.parent_id) {
        throw new Error('Thread has not been found');
      }

      const { messages } = await chatAPI.search({
        q: String(message.parent_id),
        cid,
        limit: 1,
      });

      if (!messages.length) {
        throw new Error('Thread has not been found');
      }

      const normalized = await normalizeParentMessage(messages[0]);
      if (!normalized) {
        throw new Error('Thread has not been found');
      }

      parentMessageRef.current = normalized;
    } catch {
      /* TODO backend-wire-up: addError */
    }
  };

  useEffect(() => {
    if (
      parentMessageRef.current ||
      parentMessageRef.current === null ||
      !message.parent_id
    )
      return;
    const localMessage = channel.state.messages.find(
      (m) => m.id === message.parent_id,
    ) as unknown as LocalMessage | undefined;
    if (localMessage) {
      parentMessageRef.current = localMessage;
      return;
    }
    (async () => {
      try {
        const fetched = await client.getMessage(message.parent_id);
        const normalized = await normalizeParentMessage(fetched);
        parentMessageRef.current = normalized ?? null;
      } catch (e) {
        console.error(e);
      }
    })();
  }, [channel, message]);

  if (!message.parent_id) return null;

  return (
    <div className='str-chat__message-is-thread-reply-button-wrapper'>
      <button
        className='str-chat__message-is-thread-reply-button'
        data-testid='message-is-thread-reply-button'
        onClick={async () => {
          if (!parentMessageRef.current) {
            // search query is performed here in order to prevent multiple search queries in useEffect
            // due to the message list 3x remounting its items
            await querySearchParent();
            if (parentMessageRef.current) {
              openThread(parentMessageRef.current);
            } else {
              // prevent further search queries if the message is not found in the DB
              parentMessageRef.current = null;
            }
            return;
          }
          openThread(parentMessageRef.current);
        }}
        type='button'
      >
        {t('Thread reply')}
      </button>
    </div>
  );
};
