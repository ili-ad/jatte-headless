import { channelSendMessage } from '../src/chatSDKShim';

describe('channelSendMessage', () => {
  it('posts message to backend', async () => {
    const json = { id: 1, body: 'hi' };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(json),
    });
    // @ts-ignore
    global.fetch = fetchMock;
    const channel = { cid: 'messaging:123' };
    const res = await channelSendMessage(channel, {
      text: 'hi',
      attachments: [{ id: 'a1' }],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/rooms/messaging:123/messages/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ body: 'hi', attachments: [{ id: 'a1' }] }),
      }),
    );
    expect(res).toEqual({ message: json });
  });
});
