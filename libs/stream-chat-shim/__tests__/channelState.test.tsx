import { makeChannelReducer, initialState } from '../src/channelState';

describe('channelState shim', () => {
  test('makeChannelReducer returns a reducer function', () => {
    const reducer = makeChannelReducer();
    expect(typeof reducer).toBe('function');
    const state = { v: 1 };
    expect(reducer(state, { type: 'x' } as any)).toBe(state);
  });

  test('initialState has basic fields', () => {
    expect(initialState).toHaveProperty('loading');
    expect(initialState).toHaveProperty('messages');
  });
});
