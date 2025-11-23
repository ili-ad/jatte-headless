import { useCallback } from 'react';
import { MessageComposer } from 'chat-shim';
import { useMessageComposer } from './useMessageComposer';
import { chatAPI } from '../../../api/chatAPI';
import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { MessageInputProps } from '../MessageInput';



const restoreState = (store: { next?: (v: any) => void; _set?: (v: any) => void }, value: any) => {
  if (store?.next) {
    store.next(value);
  } else if (store?._set) {
    store._set(value);
  }
};

const takeStateSnapshot = (messageComposer: MessageComposer) => {
  const textComposerState = messageComposer.textComposer.state.getLatestValue();
  const attachmentManagerState = messageComposer.attachmentManager.state.getLatestValue();
  const linkPreviewsManagerState =
    messageComposer.linkPreviewsManager.state.getLatestValue();
  const pollComposerState = messageComposer.pollComposer.state.getLatestValue();
  const customDataManagerState = messageComposer.customDataManager.state.getLatestValue();
  const state = messageComposer.state.getLatestValue();

  return () => {
    restoreState(messageComposer.state, state);
    restoreState(messageComposer.textComposer.state, textComposerState);
    restoreState(messageComposer.attachmentManager.state, attachmentManagerState);
    restoreState(messageComposer.linkPreviewsManager.state, linkPreviewsManagerState);
    restoreState(messageComposer.pollComposer.state, pollComposerState);
    restoreState(messageComposer.customDataManager.state, customDataManagerState);
  };
};

export const useSubmitHandler = (props: MessageInputProps) => {
  const { clearEditingState, overrideSubmitHandler } = props;

  const { addNotification, editMessage, sendMessage } =
    useChannelActionContext('useSubmitHandler');
  const { t } = useTranslationContext('useSubmitHandler');
  const messageComposer = useMessageComposer();

  const submitViaTextComposer = useCallback(async () => {
    const submit = (messageComposer as any)?.textComposer?.submit;
    if (typeof submit === 'function') {
      await submit();
      return true;
    }
    return false;
  }, [messageComposer]);

  const handleSubmit = useCallback(
    async (event?: React.BaseSyntheticEvent) => {
      event?.preventDefault();
      const composition = await messageComposer.compose();
      if (!composition || !composition.message) return;

      const { localMessage, message, sendOptions } = composition;

      if (messageComposer.editedMessage && localMessage.type !== 'error') {
        try {
          await editMessage(localMessage, sendOptions);
          clearEditingState?.();
        } catch (err) {
          addNotification(t('Edit message request failed'), 'error');
        }
        return;
      }

      const restoreComposerStateSnapshot = takeStateSnapshot(messageComposer);
      try {
        const submittedViaTextComposer = await submitViaTextComposer();

        if (!submittedViaTextComposer) {
          if (overrideSubmitHandler) {
            await overrideSubmitHandler({
              cid: messageComposer.channel.cid,
              localMessage,
              message,
              sendOptions,
            });
          } else {
            await sendMessage({ localMessage, message, options: sendOptions });
          }
        }

        if (messageComposer.config.text.publishTypingEvents) {
          // safe no-op today; real SDK call tomorrow
          await chatAPI.stopTyping();
        }
      } catch (err) {
        restoreComposerStateSnapshot();
        addNotification(t('Send message request failed'), 'error');
      }
    },
    [
      addNotification,
      clearEditingState,
      editMessage,
      messageComposer,
      submitViaTextComposer,
      overrideSubmitHandler,
      sendMessage,
      t,
    ],
  );

  return { handleSubmit };
};
