import type {
  LocalMessage,
  MessageResponse,
  StreamChat,
  UpdateMessageOptions,
} from 'chat-shim';

import { useChatContext } from '../../../context/ChatContext';

type UpdateHandler = (
  cid: string,
  updatedMessage: LocalMessage | MessageResponse,
  options?: UpdateMessageOptions,
) => ReturnType<StreamChat['updateMessage']>;

export const useEditMessageHandler = (doUpdateMessageRequest?: UpdateHandler) => {
  const { channel, client } = useChatContext('useEditMessageHandler');

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
      const id = (updatedMessage as any).id;
      const text = (updatedMessage as any).text ?? '';
      return client.updateMessage(id, text);
    })();
  };
};
