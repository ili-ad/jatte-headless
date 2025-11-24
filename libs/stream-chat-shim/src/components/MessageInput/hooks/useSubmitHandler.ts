import { useCallback } from 'react';
import { useMessageComposer } from './useMessageComposer';
import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useTranslationContext } from '../../../context/TranslationContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';

import type { MessageInputProps } from '../MessageInput';

// Our adapter's MessageComposer is richer than the upstream type knows about.
// Treat it as `any` here so we can call the members we actually expose from
// frontend/src/lib/stream-adapter/Channel.ts.
type AnyMessageComposer = any;

export const useSubmitHandler = (props: MessageInputProps) => {
  const { clearEditingState } = props; // currently unused, kept for future edit support

  const { addNotification } = useChannelActionContext('useSubmitHandler');
  const { t } = useTranslationContext('useSubmitHandler');
  const { channel } = useChannelStateContext('useSubmitHandler');
  const messageComposer = useMessageComposer() as AnyMessageComposer;

  /**
   * Delegate sending entirely to the adapter's textComposer.submit().
   * This is the single source of truth for:
   *   - optimistic echo
   *   - POST /api/rooms/<cid>/messages
   *   - clearing drafts
   */
  const submitViaTextComposer = useCallback(async () => {
    const submit = messageComposer?.textComposer?.submit;
    if (typeof submit === 'function') {
      await submit();
      return true;
    }
    // If there is no submit function, we warn in dev but don't crash.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[useSubmitHandler] textComposer.submit is not a function');
    }
    return false;
  }, [messageComposer]);

  const handleSubmit = useCallback(
    async (event?: React.BaseSyntheticEvent) => {
      event?.preventDefault();

      try {
        const submitted = await submitViaTextComposer();

        void channel?.stopTyping?.();

        // If submit didn't run, we treat it as a no-op; the adapter will not send.
        if (!submitted && process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[useSubmitHandler] no submission performed');
        }
      } catch (err) {
        // Log the underlying error so we can debug adapter issues.
        // eslint-disable-next-line no-console
        console.error('[useSubmitHandler] send failed', err);
        addNotification(t('Send message request failed'), 'error');
      }
    },
    [addNotification, channel, submitViaTextComposer, t],
  );

  return { handleSubmit };
};
