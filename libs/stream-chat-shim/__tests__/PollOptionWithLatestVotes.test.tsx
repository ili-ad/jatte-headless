import { PollOptionWithLatestVotes } from '../src/PollOptionWithLatestVotes';

describe('PollOptionWithLatestVotes shim', () => {
  it('throws when used', () => {
    expect(() =>
      PollOptionWithLatestVotes({ option: {} as any })
    ).toThrow('PollOptionWithLatestVotes shim not implemented');
  });
});
