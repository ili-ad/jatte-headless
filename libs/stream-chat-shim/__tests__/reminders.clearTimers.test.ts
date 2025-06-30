import { remindersClearTimers } from '../src/chatSDKShim';

describe('remindersClearTimers', () => {
  it('calls client.reminders.clearTimers when available', () => {
    const fn = jest.fn();
    remindersClearTimers({ reminders: { clearTimers: fn } } as any);
    expect(fn).toHaveBeenCalled();
  });

  it('does nothing when not implemented', () => {
    expect(() => remindersClearTimers({} as any)).not.toThrow();
  });
});
