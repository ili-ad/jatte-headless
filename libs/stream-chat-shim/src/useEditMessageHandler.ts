import type {
  LocalMessage,
  MessageResponse,
  StreamChat,
  UpdateMessageOptions,
  UpdateMessageAPIResponse,
} from 'stream-chat';

// Callback type matching Stream Chat React's expectation
export type UpdateHandler = (
  cid: string,
  updatedMessage: LocalMessage | MessageResponse,
  options?: UpdateMessageOptions,
) => ReturnType<StreamChat['updateMessage']>;

/**
 * Placeholder implementation of useEditMessageHandler.
 * Returns a function that throws to indicate unimplemented behaviour.
 */
export function useEditMessageHandler(
  _doUpdateMessageRequest?: UpdateHandler,
): (
  updatedMessage: LocalMessage | MessageResponse,
  options?: UpdateMessageOptions,
) => Promise<UpdateMessageAPIResponse> {
  return async () => {
    throw new Error('useEditMessageHandler not implemented');
  };
}
