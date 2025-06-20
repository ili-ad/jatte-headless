import { StreamChat } from 'stream-chat';

let client: StreamChat | null = null;

export function getStreamClient(): StreamChat {
  if (!client) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL is not set');
    }
    client = StreamChat.getInstance(apiUrl);
  }
  return client;
}
