import { getLocalClient, StreamChat } from 'stream-chat';


let client: StreamChat | null = null;

export const getStreamClient = (): StreamChat => {
  if (!client) {
    const key = process.env.NEXT_PUBLIC_STREAM_KEY;
    client = key
      ? StreamChat.getInstance(key)
      : getLocalClient();
  }
  return client;
};
