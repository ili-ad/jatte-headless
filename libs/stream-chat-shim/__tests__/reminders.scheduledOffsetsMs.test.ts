import { chatAPI } from '../src/api/chatAPI';
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

describe('chatAPI.reminders.scheduledOffsetsMs', () => {
  it('normalizes offset values from the provided client', () => {
    const client = {
      reminders: {
        scheduledOffsetsMs: [1000, Number.NaN, '5000', 2000],
      },
    } as any;

    expect(chatAPI.reminders.scheduledOffsetsMs({ client })).toEqual([1000, 2000]);
  });

  it('returns default offsets when client data is missing', () => {
    expect(chatAPI.reminders.scheduledOffsetsMs({})).toEqual([
      5 * 60 * 1000,
      30 * 60 * 1000,
      60 * 60 * 1000,
      24 * 60 * 60 * 1000,
    ]);
  });
});
