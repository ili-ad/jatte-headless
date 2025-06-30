import { stopTyping } from '../src/chatSDKShim';
import { stopTyping as impl } from 'chat-shim/typing';

jest.mock('chat-shim/typing', () => ({
  stopTyping: jest.fn().mockResolvedValue(undefined),
}));

describe('stopTyping', () => {
  it('delegates to chat-shim implementation', async () => {
    await stopTyping();
    expect(impl).toHaveBeenCalled();
  });
});
