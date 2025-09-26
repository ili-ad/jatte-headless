import { clientThreadsState } from '../src/chatSDKShim';
import { StateStore } from 'chat-shim';

describe('clientThreadsState', () => {
  it('returns client.threads.state when available', () => {
    const store = new StateStore({ count: 1 });
    const client = { threads: { state: store } } as any;
    expect(clientThreadsState(client)).toBe(store);
  });

  it('returns a StateStore when threads.state is missing', () => {
    const client = {} as any;
    const store = clientThreadsState(client);
    expect(store).toBeInstanceOf(StateStore);
    expect(store.getLatestValue()).toMatchObject({
      threads: [],
      unseenThreadIds: [],
      unreadThreadCount: 0,
    });
  });
});
