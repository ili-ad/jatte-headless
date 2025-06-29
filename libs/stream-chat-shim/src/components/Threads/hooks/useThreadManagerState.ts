import type { ThreadManagerState } from 'chat-shim';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import { clientThreadsState } from '../../../chatSDKShim';

export const useThreadManagerState = <T extends readonly unknown[]>(
  selector: (nextValue: ThreadManagerState) => T,
) => {
  const { client } = useChatContext();

  return useStateStore(clientThreadsState(client), selector);
};
