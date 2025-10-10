import React, { useEffect, useState } from 'react';
import type { StreamChat } from 'chat-shim';
import type { PropsWithChildren } from 'react';
import type { OwnUserResponse, TokenOrProvider, UserResponse } from 'chat-shim';

import { Chat } from '../';

const appKey = import.meta.env.E2E_APP_KEY;
if (!appKey || typeof appKey !== 'string') {
  throw new Error('expected APP_KEY');
}
export const streamAPIKey = appKey;

export type ConnectedUserProps = PropsWithChildren<{
  token: string;
  userId: string;
}>;

const useClient = ({
  apiKey,
  tokenOrProvider,
  userData,
}: {
  apiKey: string;
  tokenOrProvider: TokenOrProvider;
  userData: OwnUserResponse | UserResponse;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    let didUserConnectInterrupt = false;

    const connectPromise = (async () => {
      /* TODO backend-wire-up:connectUser */
      void apiKey;
      void tokenOrProvider;
      void userData;
      return {} as StreamChat;
    })();

    connectPromise.then((connectedClient) => {
      if (!didUserConnectInterrupt) {
        setChatClient(connectedClient);
      }
    });

    return () => {
      didUserConnectInterrupt = true;
      setChatClient(null);
      void connectPromise.then(() => {
        /* TODO backend-wire-up:disconnectUser */
        void apiKey;
        void tokenOrProvider;
        void userData;
        console.log('connection closed');
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, userData.id, tokenOrProvider]);

  return chatClient;
};

export const ConnectedUser = ({ children, token, userId }: ConnectedUserProps) => {
  const client = useClient({
    apiKey: streamAPIKey,
    tokenOrProvider: token,
    userData: { id: userId },
  });

  if (!client)
    return <p>Waiting for connection to be established with user: {userId}...</p>;

  return (
    <>
      <h3>User: {userId}</h3>
      <div className='chat-wrapper'>
        <Chat client={client}>{children}</Chat>
      </div>
    </>
  );
};
