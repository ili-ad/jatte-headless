import { nanoid } from 'nanoid';
import { StateStore } from 'stream-chat';

export type GetOrCreateDialogParams = {
  id: DialogId;
};

export type DialogId = string;

export type Dialog = {
  close: () => void;
  id: DialogId;
  isOpen: boolean | undefined;
  open: (zIndex?: number) => void;
  removalTimeout: NodeJS.Timeout | undefined;
  remove: () => void;
  toggle: (closeAll?: boolean) => void;
};

export type DialogManagerOptions = {
  id?: string;
};

export type Dialogs = Record<DialogId, Dialog>;

export type DialogManagerState = {
  dialogsById: Dialogs;
};

/**
 * Placeholder implementation of the DialogManager class. The public API mirrors
 * Stream Chat React's DialogManager but methods do not provide real behaviour.
 */
export class DialogManager {
  id: string;
  state = new StateStore<DialogManagerState>({ dialogsById: {} });

  constructor({ id }: DialogManagerOptions = {}) {
    this.id = id ?? nanoid();
  }

  get openDialogCount() {
    return 0;
  }

  getOrCreate({ id }: GetOrCreateDialogParams): Dialog {
    return {
      id,
      isOpen: false,
      open: () => this.open({ id }),
      close: () => this.close(id),
      toggle: (closeAll?: boolean) => this.toggle({ id }, closeAll),
      remove: () => this.remove(id),
      removalTimeout: undefined,
    };
  }

  open(_params: GetOrCreateDialogParams, _closeRest?: boolean) {
    throw new Error('DialogManager.open not implemented');
  }

  close(_id: DialogId) {
    throw new Error('DialogManager.close not implemented');
  }

  closeAll() {
    throw new Error('DialogManager.closeAll not implemented');
  }

  toggle(_params: GetOrCreateDialogParams, _closeAll = false) {
    throw new Error('DialogManager.toggle not implemented');
  }

  remove(_id: DialogId) {
    throw new Error('DialogManager.remove not implemented');
  }

  markForRemoval(_id: DialogId) {
    throw new Error('DialogManager.markForRemoval not implemented');
  }
}

export default DialogManager;
