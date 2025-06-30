import { sendReaction } from '../src/chatSDKShim';

describe('sendReaction', () => {
  it('calls channel.sendReaction when available', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const res = await sendReaction({ sendReaction: fn } as any, 'm1', 'like');
    expect(fn).toHaveBeenCalledWith('m1', 'like');
    expect(res).toBe('ok');
  });

  it('POSTs to /api/messages/ when not implemented', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ json: () => Promise.resolve('ok') });
    // @ts-ignore
    global.fetch = fetchMock;
    const res = await sendReaction(undefined as any, 'm1', 'like');
    expect(fetchMock).toHaveBeenCalledWith('/api/messages/m1/reactions/', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'like' }),
    });
    expect(res).toBe('ok');
  });
});
