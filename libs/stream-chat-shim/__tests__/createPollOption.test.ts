import { createPollOption } from '../src/chatSDKShim';

describe('createPollOption shim', () => {
  it('resolves', async () => {
    await expect(createPollOption('poll1', { text: 'opt' })).resolves.toBeUndefined();
  });
});
