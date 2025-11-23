'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require('@testing-library/react');
const useSubmitHandler_1 = require('../src/components/MessageInput/hooks/useSubmitHandler');

const store = (value) => ({
  getLatestValue: jest.fn(() => value),
  subscribe: () => () => {},
  _set: jest.fn(),
});

const composeMock = jest.fn(async () => ({
  localMessage: { id: 'local-1', text: 'hi', user_id: 'user-1' },
  message: { id: 'local-1', text: 'hi', user_id: 'user-1' },
  sendOptions: {},
}));

const textSubmitMock = jest.fn(async () => {});
const sendMessageMock = jest.fn();
const addNotificationMock = jest.fn();
const editMessageMock = jest.fn();

jest.mock('../src/components/MessageInput/hooks/useMessageComposer', () => ({
  useMessageComposer: () => ({
    attachmentManager: { state: store({ attachments: [] }) },
    channel: { cid: 'messaging:room1' },
    compose: composeMock,
    config: { text: { publishTypingEvents: false } },
    customDataManager: { state: store({ customData: {} }) },
    editedMessage: undefined,
    linkPreviewsManager: { state: store({ previews: [] }) },
    pollComposer: { state: store({ poll: undefined }) },
    state: store({ quotedMessage: undefined, showReplyInChannel: false }),
    textComposer: { state: store({ text: 'hi' }), submit: textSubmitMock },
  }),
}));

jest.mock('../src/context/ChannelActionContext', () => ({
  useChannelActionContext: () => ({
    addNotification: addNotificationMock,
    editMessage: editMessageMock,
    sendMessage: sendMessageMock,
  }),
}));

jest.mock('../src/context/TranslationContext', () => ({
  useTranslationContext: () => ({ t: (key) => key }),
}));

jest.mock('../src/api/chatAPI', () => ({ chatAPI: { stopTyping: jest.fn() } }));

test('handleSubmit delegates to textComposer submit instead of sendMessage action', async () => {
  const { result } = (0, react_1.renderHook)(() => (0, useSubmitHandler_1.useSubmitHandler)({}));

  await (0, react_1.act)(async () => {
    await result.current.handleSubmit();
  });

  expect(composeMock).toHaveBeenCalledTimes(1);
  expect(textSubmitMock).toHaveBeenCalledTimes(1);
  expect(sendMessageMock).not.toHaveBeenCalled();
  expect(addNotificationMock).not.toHaveBeenCalled();
  expect(editMessageMock).not.toHaveBeenCalled();
});
