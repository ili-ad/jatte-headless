import { ChatClient } from './stream-adapter';
import { getLocalClient } from 'stream-chat';

type AnyClient = ChatClient & Record<string, unknown>;

let client: AnyClient | null = null;

export const getStreamClient = (): AnyClient => {
  if (!client) {
    client = process.env.NEXT_PUBLIC_STREAM_KEY
      ? new ChatClient()
      : (getLocalClient() as AnyClient);
  }
  return client;
};
