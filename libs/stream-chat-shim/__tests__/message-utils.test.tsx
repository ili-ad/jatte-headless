import { isUserMuted, isOnlyEmojis } from '../src/components/Message/utils';

describe('message-utils', () => {
  test('isUserMuted detects muted user', () => {
    const message: any = { user: { id: 'u1' } };
    const mutes: any = [{ target: { id: 'u1' } }];
    expect(isUserMuted(message, mutes)).toBe(true);
  });

  test('isOnlyEmojis works', () => {
    expect(isOnlyEmojis('😀')).toBe(true);
    expect(isOnlyEmojis('hi')).toBe(false);
  });
});
