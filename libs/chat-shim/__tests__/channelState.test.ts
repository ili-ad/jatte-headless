import { ChannelState } from '../index';

describe('ChannelState', () => {
  test('countUnread returns 0 when user missing', () => {
    const state = new ChannelState();
    state.read = {};
    expect(state.countUnread('u1')).toBe(0);
  });

  test('countUnread returns unread_messages', () => {
    const state = new ChannelState();
    state.read = { u1: { unread_messages: 2 } } as any;
    expect(state.countUnread('u1')).toBe(2);
  });
});
