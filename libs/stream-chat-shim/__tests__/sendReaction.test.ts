jest.mock('../src/api/chatAPI', () => {
  const actual = jest.requireActual('../src/api/chatAPI');
  return {
    ...actual,
    chatAPI: {
      ...actual.chatAPI,
      sendReaction: jest.fn().mockResolvedValue('ok'),
    },
  };
});

import { chatAPI } from '../src/api/chatAPI';
import { sendReaction } from '../src/chatSDKShim';

describe('sendReaction', () => {
  it('delegates to chatAPI.sendReaction', async () => {
    const res = await sendReaction('m1', 'like');

    expect(chatAPI.sendReaction).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: 'm1', type: 'like' }),
    );
    expect(res).toBe('ok');
  });
});
