import { clientOff } from '../src/chatSDKShim';

describe('clientOff', () => {
  it('calls client.off when available', () => {
    const fn = jest.fn();
    const handler = jest.fn();
    clientOff({ off: fn }, 'user.updated', handler);
    expect(fn).toHaveBeenCalledWith('user.updated', handler);
  });

  it('does nothing when not implemented', () => {
    expect(() => clientOff({} as any, 'event', () => {})).not.toThrow();
  });
});
