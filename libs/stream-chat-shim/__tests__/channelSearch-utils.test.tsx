import { isChannel } from '../src/channelSearch-utils';

describe('channelSearch-utils', () => {
  test('isChannel detects channel objects', () => {
    const channel = { cid: 'messaging:general' } as any;
    const user = { id: 'alice' } as any;
    expect(isChannel(channel)).toBe(true);
    expect(isChannel(user)).toBe(false);
  });
});

