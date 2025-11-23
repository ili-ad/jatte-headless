'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require('react');
const react_2 = require('@testing-library/react');
const MessageInputFlat_1 = require('../src/components/MessageInput/MessageInputFlat');

const handleSubmit = jest.fn();

jest.mock('../src/context/MessageContext', () => ({ useMessageContext: () => ({ message: undefined }) }));
jest.mock('../src/context/MessageInputContext', () => ({
  useMessageInputContext: () => ({
    asyncMessagesMultiSendEnabled: false,
    cooldownRemaining: 0,
    handleSubmit,
    hideSendButton: false,
    recordingController: { permissionState: 'granted', recorder: null, recordingState: null },
    setCooldownRemaining: jest.fn(),
  }),
}));
jest.mock('../src/context/ChatContext', () => ({ useChatContext: () => ({ channel: { cid: 'messaging:room1' } }) }));
jest.mock('../src/context/ComponentContext', () => ({
  useComponentContext: () => ({
    AttachmentPreviewList: () => null,
    AttachmentSelector: () => null,
    AudioRecorder: () => null,
    CooldownTimer: () => null,
    EmojiPicker: null,
    LinkPreviewList: () => null,
    QuotedMessagePreview: () => null,
    RecordingPermissionDeniedNotification: () => null,
    SendButton: ({ sendMessage }) => (0, react_1.createElement)('button', { 'aria-label': 'Send', onClick: sendMessage }, 'Send now'),
    SendToChannelCheckbox: () => null,
    StartRecordingAudioButton: () => null,
    StopAIGenerationButton: null,
    TextareaComposer: () => (0, react_1.createElement)('textarea', { 'aria-label': 'Message composer' }),
  }),
}));
jest.mock('../src/components/MessageInput/hooks/useAttachmentManagerState', () => ({
  useAttachmentManagerState: () => ({ attachments: [] }),
}));
jest.mock('../src/context/TranslationContext', () => ({
  useTranslationContext: () => ({ t: (key) => key }),
}));
jest.mock('../src/components/AIStateIndicator', () => ({
  AIStates: { Generating: 'generating', Thinking: 'thinking' },
  useAIState: () => ({ aiState: 'idle' }),
}));
jest.mock('../src/components/MessageInput/WithDragAndDropUpload', () => ({
  WithDragAndDropUpload: ({ children, ...rest }) => (0, react_1.createElement)('div', { 'data-testid': 'drag-drop-wrapper', ...rest }, children),
}));
jest.mock('../src/api/chatAPI', () => ({ chatAPI: { stopAIResponse: jest.fn() } }));

test('Send button triggers the submit handler from context', () => {
  const { getByLabelText } = (0, react_2.render)((0, react_1.createElement)(MessageInputFlat_1.MessageInputFlat, null));

  (0, react_2.fireEvent).click(getByLabelText('Send'));

  expect(handleSubmit).toHaveBeenCalledTimes(1);
});
