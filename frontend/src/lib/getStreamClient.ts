// frontend/src/lib/getStreamClient.ts
import { ChatClient } from '../chat-kit/client';

// If you still want a generic alias, keep it here:
export type AnyClient = ChatClient;

let client: AnyClient | null = null;

export function getStreamClient(): AnyClient {
  if (client) return client;

  // ChatClient does not take an options object; just construct it.
  client = new ChatClient();

  return client;
}
