import { defaultRenderMessages } from '../src/components/MessageList/renderMessages';

test('returns empty array when no messages', () => {
  const result = defaultRenderMessages({
    components: {} as any,
    lastReceivedMessageId: null,
    messageGroupStyles: {},
    messages: [],
    readData: {},
    sharedMessageProps: {} as any,
  });
  expect(result).toEqual([]);
});
