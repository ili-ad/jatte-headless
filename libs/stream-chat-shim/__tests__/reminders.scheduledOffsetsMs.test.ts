import { remindersScheduledOffsetsMs } from '../src/chatSDKShim';

describe('remindersScheduledOffsetsMs', () => {
  it('returns client.reminders.scheduledOffsetsMs when available', () => {
    const client = { reminders: { scheduledOffsetsMs: [1, 2, 3] } } as any;
    expect(remindersScheduledOffsetsMs(client)).toEqual([1, 2, 3]);
  });

  it('falls back to default values when not implemented', () => {
    const res = remindersScheduledOffsetsMs();
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  });
});
