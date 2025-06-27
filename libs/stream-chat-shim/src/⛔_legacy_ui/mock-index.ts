import { StreamChat } from 'chat-shim';

/** Options for configuring mocked behaviour of the chat client. */
export type MockClientOptions = Record<string, unknown>;

/**
 * Returns the provided StreamChat client. This placeholder does not apply any
 * mocks. In a real implementation this would attach mock handlers to the
 * client instance.
 */
export function mockClient(
  client: StreamChat,
  _mocks?: MockClientOptions,
): StreamChat {
  return client;
}

/**
 * Creates a StreamChat client instance for use in tests. This placeholder just
 * instantiates the client with a dummy API key and returns it.
 */
export function getTestClient(_mocks?: MockClientOptions): StreamChat {
  const apiKey = 'test';
  const client = new StreamChat(apiKey);
  return mockClient(client, _mocks);
}

export default {
  getTestClient,
  mockClient,
};
