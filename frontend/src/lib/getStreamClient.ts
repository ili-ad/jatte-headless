import { getLocalClient } from 'stream-chat';
import type { StreamChat } from 'stream-chat';

let client: StreamChat | null = null;

export const getStreamClient = (): StreamChat => {
  if (!client) {
    const key = process.env.NEXT_PUBLIC_STREAM_KEY;
    client = key
      ? (StreamChat as any).getInstance(key)
      : (getLocalClient() as unknown as StreamChat);
  }
  return client;
};
