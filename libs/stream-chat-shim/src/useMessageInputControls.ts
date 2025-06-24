import { useCallback, useEffect, useRef } from 'react';
import type { MessageInputProps } from './MessageInput';
import { useMediaRecorder } from './useMediaRecorder';
import type { RecordingController } from './useMediaRecorder';

export type MessageInputHookProps = {
  handleSubmit: (
    event?: React.BaseSyntheticEvent,
    customMessageData?: any,
  ) => void;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  recordingController: RecordingController;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null | undefined>;
};

const useTextareaRefPlaceholder = (
  props: MessageInputProps,
): { textareaRef: React.MutableRefObject<HTMLTextAreaElement | null | undefined> } => {
  const { focus } = props as any;
  const textareaRef = useRef<HTMLTextAreaElement | null>();
  useEffect(() => {
    if (focus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [focus]);
  return { textareaRef };
};

const useSubmitHandlerPlaceholder = (
  _props: MessageInputProps,
): { handleSubmit: (event?: React.BaseSyntheticEvent, customMessageData?: any) => void } => {
  const handleSubmit = useCallback(
    (_event?: React.BaseSyntheticEvent) => {
      throw new Error('useSubmitHandler not implemented');
    },
    [],
  );
  return { handleSubmit };
};

const usePasteHandlerPlaceholder = (): {
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
} => {
  const onPaste = useCallback(
    (_event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      // TODO: implement paste handling
    },
    [],
  );
  return { onPaste };
};

export const useMessageInputControls = (
  props: MessageInputProps,
): MessageInputHookProps => {
  const { asyncMessagesMultiSendEnabled, audioRecordingConfig, audioRecordingEnabled } =
    props as any;

  const { textareaRef } = useTextareaRefPlaceholder(props);
  const { handleSubmit } = useSubmitHandlerPlaceholder(props);
  const recordingController = useMediaRecorder({
    asyncMessagesMultiSendEnabled: !!asyncMessagesMultiSendEnabled,
    enabled: !!audioRecordingEnabled,
    handleSubmit: () => handleSubmit(),
    recordingConfig: audioRecordingConfig as any,
  });
  const { onPaste } = usePasteHandlerPlaceholder();

  return {
    handleSubmit,
    onPaste,
    recordingController,
    textareaRef,
  };
};

export default useMessageInputControls;
