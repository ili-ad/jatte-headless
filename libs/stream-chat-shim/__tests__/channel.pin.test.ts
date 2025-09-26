jest.mock('../../chat-shim', () => {
  class StateStore<T> {
    constructor(_init?: T) {}
    getLatestValue(): T | undefined {
      return undefined;
    }
    dispatch(): void {}
    subscribe(): () => void {
      return () => {};
    }
    subscribeWithSelector(): () => void {
      return () => {};
    }
    next(): void {}
    partialNext(): void {}
  }

  return { StateStore };
});

import { channelPin } from '../src/chatSDKShim';

describe('channelPin', () => {
  it('calls channel.pin when provided a message id', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const messageId = 'message-1';
    const result = await channelPin({ pin: fn }, messageId);
    expect(fn).toHaveBeenCalledWith(messageId);
    expect(result).toBe('ok');
  });

  it('calls channel.pin when provided a message object', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const message = { id: 'message-2', text: 'Hello world' };
    const result = await channelPin({ pin: fn }, message);
    expect(fn).toHaveBeenCalledWith(message);
    expect(result).toBe('ok');
  });

  it('calls channel.pin without a message when no target is provided', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await channelPin({ pin: fn });
    expect(fn).toHaveBeenCalledWith(undefined);
    expect(result).toBe('ok');
  });

  it('resolves undefined when channel.pin is unavailable', async () => {
    await expect(channelPin({} as any)).resolves.toBeUndefined();
  });
});
