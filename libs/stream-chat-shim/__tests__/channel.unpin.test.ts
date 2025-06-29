import { channelUnpin } from '../src/chatSDKShim';

describe('channelUnpin', () => {
  it('calls channel.unpin when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const res = await channelUnpin({ unpin: fn });
    expect(fn).toHaveBeenCalled();
    expect(res).toBe('ok');
  });

  it('resolves undefined when not implemented', async () => {
    await expect(channelUnpin({} as any)).resolves.toBeUndefined();
  });
});
