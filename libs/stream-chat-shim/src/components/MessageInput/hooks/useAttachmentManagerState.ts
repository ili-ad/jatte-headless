import { useMessageComposer } from './useMessageComposer';
import { useStateStore } from '../../../store';
import type { AttachmentManagerState } from 'chat-shim';

const stateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
});

export const useAttachmentManagerState = () => {
  const { attachmentManager } = useMessageComposer();
  const { attachments } = useStateStore(attachmentManager.state, stateSelector);
  return {
    attachments,
    availableUploadSlots: attachmentManager.availableUploadSlots,
    blockedUploadsCount: attachmentManager.blockedUploadsCount,
    failedUploadsCount: attachmentManager.failedUploadsCount,
    isUploadEnabled: attachmentManager.isUploadEnabled,
    pendingUploadsCount: attachmentManager.pendingUploadsCount,
    successfulUploadsCount: attachmentManager.successfulUploadsCount,
    uploadsInProgressCount: attachmentManager.uploadsInProgressCount,
  };
};
