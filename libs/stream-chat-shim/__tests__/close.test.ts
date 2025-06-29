import { close } from '../src/chatSDKShim';

describe('close shim', () => {
  it('resolves', async () => {
    await expect(close()).resolves.toBeUndefined();
  });
});
