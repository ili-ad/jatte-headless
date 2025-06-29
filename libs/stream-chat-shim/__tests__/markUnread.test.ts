import { markUnread } from '../src/chatSDKShim';

describe('markUnread', () => {
  it('calls channel.markUnread when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const res = await markUnread({ markUnread: fn } as any, 'm1');
    expect(fn).toHaveBeenCalledWith('m1');
    expect(res).toBe('ok');
  });

  it('resolves undefined when not implemented', async () => {
    await expect(markUnread({} as any, 'm1')).resolves.toBeUndefined();
  });
});
