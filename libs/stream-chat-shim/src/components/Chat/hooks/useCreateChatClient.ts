import { useEffect, useState } from 'react';

import { StreamChat } from 'chat-shim';

import type {
  OwnUserResponse,
  StreamChatOptions,
  TokenOrProvider,
  UserResponse,
} from 'chat-shim';

/**
 * React hook to create, connect and return `StreamChat` client.
 */
export const useCreateChatClient = ({
  apiKey,
  options,
  tokenOrProvider,
  userData,
}: {
  apiKey: string;
  tokenOrProvider: TokenOrProvider;
  userData: OwnUserResponse | UserResponse;
  options?: StreamChatOptions;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [cachedUserData, setCachedUserData] = useState(userData);

  if (userData.id !== cachedUserData.id) {
    setCachedUserData(userData);
  }

  const [cachedOptions] = useState(options);

  useEffect(() => {
    const client = new StreamChat(apiKey, undefined, cachedOptions);
    let didUserConnectInterrupt = false;

    const connectionPromise = client
      .connectUser(cachedUserData, tokenOrProvider)
      .then(() => {
        if (!didUserConnectInterrupt) setChatClient(client);
      });

    return () => {
      didUserConnectInterrupt = true;
      setChatClient(null);
      connectionPromise
        .then(() => client.disconnectUser())
        .then(() => {
          console.log(`Connection for user "${cachedUserData.id}" has been closed`);
        });
    };
  }, [apiKey, cachedUserData, cachedOptions, tokenOrProvider]);

  return chatClient;
};
