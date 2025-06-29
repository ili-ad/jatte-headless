import { pollsFromState } from '../src/chatSDKShim';
import { StateStore } from 'chat-shim';

describe('pollsFromState', () => {
  it('returns poll when found in store', () => {
    const poll = { id: 'p1' } as any;
    const store = new StateStore<{ polls: any[] }>({ polls: [poll] });
    const client = { polls: { store } } as any;
    expect(pollsFromState(client, 'p1')).toBe(poll);
  });

  it('returns undefined when not found', () => {
    const store = new StateStore<{ polls: any[] }>({ polls: [] });
    const client = { polls: { store } } as any;
    expect(pollsFromState(client, 'p1')).toBeUndefined();
  });
});
