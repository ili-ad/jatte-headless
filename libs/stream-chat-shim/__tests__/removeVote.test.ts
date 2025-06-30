import { removeVote } from '../src/chatSDKShim';

describe('removeVote shim', () => {
  it('resolves', async () => {
    await expect(removeVote('vote1', 'msg1')).resolves.toBeUndefined();
  });
});
