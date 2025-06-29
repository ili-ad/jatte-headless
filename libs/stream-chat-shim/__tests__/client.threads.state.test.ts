import { clientThreadsState } from '../src/chatSDKShim';
import { StateStore } from 'chat-shim';
import { noopStore } from 'chat-shim/noopStore';

describe('clientThreadsState', () => {
  it('returns client.threads.state when available', () => {
    const store = new StateStore({ count: 1 });
    const client = { threads: { state: store } } as any;
    expect(clientThreadsState(client)).toBe(store);
  });

  it('falls back to noopStore when not implemented', () => {
    const client = {} as any;
    expect(clientThreadsState(client)).toBe(noopStore);
  });
});
