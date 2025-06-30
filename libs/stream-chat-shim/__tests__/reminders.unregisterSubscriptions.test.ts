import { remindersUnregisterSubscriptions } from '../src/chatSDKShim';

describe('remindersUnregisterSubscriptions', () => {
  it('calls client.reminders.unregisterSubscriptions when available', () => {
    const fn = jest.fn();
    remindersUnregisterSubscriptions({ reminders: { unregisterSubscriptions: fn } } as any);
    expect(fn).toHaveBeenCalled();
  });

  it('does nothing when not implemented', () => {
    expect(() => remindersUnregisterSubscriptions({} as any)).not.toThrow();
  });
});
