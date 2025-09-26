import type {
  LocalMessage,
  MessageResponse,
  StreamChat,
  UpdateMessageOptions,
} from 'chat-shim';

import { useChatContext } from '../../../context/ChatContext';
import { chatAPI, type Message as APIMessage } from '../../../api/chatAPI';

type UpdateHandler = (
  cid: string,
  updatedMessage: LocalMessage | MessageResponse,
  options?: UpdateMessageOptions,
) => ReturnType<StreamChat['updateMessage']>;

export const useEditMessageHandler = (doUpdateMessageRequest?: UpdateHandler) => {
  const { channel } = useChatContext('useEditMessageHandler');

  return (
    updatedMessage: LocalMessage | MessageResponse,
    options?: UpdateMessageOptions,
  ) => {
    if (doUpdateMessageRequest && channel) {
      return Promise.resolve(
        doUpdateMessageRequest(channel.cid, updatedMessage, options),
      );
    }
    return (async () => {
      if (!channel?.cid) {
        throw new Error('Cannot update a message - missing channel.');
      }

      const rawId = (updatedMessage as { id?: string | number }).id;
      if (rawId === undefined || rawId === null) {
        throw new Error('Cannot update a message - missing message ID.');
      }

      const messageId = Number(rawId);
      if (Number.isNaN(messageId)) {
        throw new Error(
          `Cannot update a message - invalid message ID "${String(rawId)}".`,
        );
      }

      const textValue = (updatedMessage as { text?: string }).text;
      const text = typeof textValue === 'string' ? textValue : '';

      const apiMessage: APIMessage = await chatAPI.updateMessage({
        cid: channel.cid,
        message_id: messageId,
        text,
      });

      const createdAt = new Date(apiMessage.created_at);
      const existingMessage = channel.state?.messages?.find?.(
        (msg) =>
          String((msg as { id?: string | number }).id) ===
          String(apiMessage.id),
      ) as MessageResponse | undefined;

      const defaults: Record<string, unknown> = existingMessage
        ? {}
        : {
            latest_reactions: [] as unknown[],
            own_reactions: [] as unknown[],
            reaction_groups: {},
          };

      const normalizedMessage = {
        ...defaults,
        ...(existingMessage as Record<string, unknown> | undefined),
        id: String(apiMessage.id),
        cid: channel.cid,
        created_at: createdAt,
        updated_at: new Date(),
        type: (existingMessage as { type?: unknown })?.type ?? 'regular',
        status: (existingMessage as { status?: unknown })?.status ?? 'received',
        text: apiMessage.body,
        html: apiMessage.body,
        body: apiMessage.body,
        user:
          (existingMessage as { user?: unknown })?.user ??
          ({ id: apiMessage.sent_by } as Record<string, unknown>),
        user_id: apiMessage.sent_by,
      } as MessageResponse;

      return { message: normalizedMessage } as ReturnType<
        StreamChat['updateMessage']
      >;
    })();
  };
};
