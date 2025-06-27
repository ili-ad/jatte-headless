import { useMessageComposer } from './useMessageComposer';
import { useStateStore } from '../../../store';
import type { EditingAuditState } from 'chat-shim';

const editingAuditStateStateSelector = (state: EditingAuditState) => state;

export const useMessageComposerHasSendableData = () => {
  const messageComposer = useMessageComposer();
  useStateStore(messageComposer.editingAuditState, editingAuditStateStateSelector);
  return messageComposer.hasSendableData;
};
