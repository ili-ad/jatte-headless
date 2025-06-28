// libs/chat-shim/MessageComposer.ts
import { noopStore } from './noopStore';

export class MessageComposer {
  static generateId() {
    return 'placeholder-' + Math.random().toString(36).slice(2);
  }

  state               = noopStore;
  textComposer        = { state: noopStore };
  attachmentManager   = { state: noopStore };
  linkPreviewsManager = { state: noopStore };
  pollComposer        = { state: noopStore };
  customDataManager   = { state: noopStore };

  clear() {}
  async compose() {
    // minimal shape that <MessageInput /> expects
    return { localMessage: { type: 'regular' }, message: {}, sendOptions: {} };
  }
}
