import { reminder } from '../src/reminder';

describe('reminder shim', () => {
  it('throws when called', () => {
    expect(() => reminder()).toThrow('reminder shim not implemented');
  });
});
