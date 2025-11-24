// libs/chat-shim/MessageComposer.ts
import { noopStore } from './noopStore';

export class MessageComposer {
  static generateId() {
    return 'placeholder-' + Math.random().toString(36).slice(2);
  }

  state               = noopStore;
  textComposer        = {
    state: noopStore,
    submit: async () => {
      const composition = await this.compose();
      if (!composition || !composition.message) return;
      this.clear();
      console.log("this.clear() fired from MessageComposer.ts")
    },
  };
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
