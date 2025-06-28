import { channelSendMessage } from '../src/chatSDKShim';

describe('channelSendMessage', () => {
  it('posts message to backend', async () => {
    const json = { id: 1, text: 'hi' };
    const fetchMock = jest.fn().mockResolvedValue({ json: () => Promise.resolve(json) });
    // @ts-ignore
    global.fetch = fetchMock;
    const channel = { cid: 'messaging:123' };
    const res = await channelSendMessage(channel, { text: 'hi' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/rooms/messaging:123/messages/',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(res).toEqual(json);
  });
});
