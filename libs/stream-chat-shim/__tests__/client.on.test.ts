import { clientOn } from '../src/chatSDKShim';

describe('clientOn', () => {
  it('calls client.on when available', () => {
    const fn = jest.fn();
    const handler = jest.fn();
    clientOn({ on: fn }, 'user.updated', handler);
    expect(fn).toHaveBeenCalledWith('user.updated', handler);
  });

  it('returns undefined when not implemented', () => {
    expect(clientOn({} as any, 'event', () => {})).toBeUndefined();
  });
});
