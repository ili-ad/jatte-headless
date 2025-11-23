import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { MessageInputFlat } from '../src/components/MessageInput/MessageInputFlat';

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
    SendButton: ({ sendMessage }: any) => (
      <button aria-label='Send' onClick={sendMessage}>
        Send now
      </button>
    ),
    SendToChannelCheckbox: () => null,
    StartRecordingAudioButton: () => null,
    StopAIGenerationButton: null,
    TextareaComposer: () => <textarea aria-label='Message composer' />,
  }),
}));
jest.mock('../src/components/MessageInput/hooks/useAttachmentManagerState', () => ({
  useAttachmentManagerState: () => ({ attachments: [] }),
}));
jest.mock('../src/context/TranslationContext', () => ({
  useTranslationContext: () => ({ t: (key: string) => key }),
}));
jest.mock('../src/components/AIStateIndicator', () => ({
  AIStates: { Generating: 'generating', Thinking: 'thinking' },
  useAIState: () => ({ aiState: 'idle' }),
}));
jest.mock('../src/components/MessageInput/WithDragAndDropUpload', () => ({
  WithDragAndDropUpload: ({ children, ...rest }: any) => (
    <div data-testid='drag-drop-wrapper' {...rest}>
      {children}
    </div>
  ),
}));
jest.mock('../src/api/chatAPI', () => ({ chatAPI: { stopAIResponse: jest.fn() } }));

test('Send button triggers the submit handler from context', () => {
  const { getByLabelText } = render(<MessageInputFlat />);

  fireEvent.click(getByLabelText('Send'));

  expect(handleSubmit).toHaveBeenCalledTimes(1);
});
