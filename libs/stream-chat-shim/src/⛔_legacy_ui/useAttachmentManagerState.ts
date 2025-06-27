import type { AttachmentManagerState, StateStore } from 'chat-shim';
import { useStateStore } from 'chat-shim';

/**
 * Hook to access the current attachment manager state.
 *
 * @param manager - State store or object containing the attachment manager state.
 * @returns The latest attachment manager state from the provided store.
 */
export const useAttachmentManagerState = (
  manager?: StateStore<AttachmentManagerState> | { state: StateStore<AttachmentManagerState> },
) => {
  const store = (manager as any)?.state ?? manager;
  return useStateStore<AttachmentManagerState>(store as StateStore<AttachmentManagerState>);
};
