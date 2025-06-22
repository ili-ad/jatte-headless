import { ChatClient } from './stream-adapter';


let client: ChatClient | null = null;

export const getStreamClient = (): ChatClient => {
  if (!client) {
    client = new ChatClient();
  }
  return client;
};
