import { castVote } from '../src/chatSDKShim';

describe('castVote shim', () => {
  it('resolves', async () => {
    await expect(castVote('opt1', 'msg1')).resolves.toBeUndefined();
  });
});
