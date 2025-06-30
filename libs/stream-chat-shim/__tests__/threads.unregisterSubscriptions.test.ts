import { threadsUnregisterSubscriptions } from '../src/chatSDKShim';

describe('threadsUnregisterSubscriptions', () => {
  it('calls client.threads.unregisterSubscriptions when available', () => {
    const fn = jest.fn();
    threadsUnregisterSubscriptions({ threads: { unregisterSubscriptions: fn } } as any);
    expect(fn).toHaveBeenCalled();
  });

  it('does nothing when not implemented', () => {
    expect(() => threadsUnregisterSubscriptions({} as any)).not.toThrow();
  });
});
