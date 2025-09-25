jest.mock('react', () => ({}), { virtual: true });

import { threadsRegisterSubscriptions } from '../src/chatSDKShim';
import { chatAPI } from '../src/api/chatAPI';

describe('threadsRegisterSubscriptions', () => {
  it('registers via chatAPI helper', async () => {
    const spy = jest
      .spyOn(chatAPI, 'registerSubscriptions')
      .mockResolvedValue({ subscriptions: [] });

    await threadsRegisterSubscriptions();

    expect(spy).toHaveBeenCalledWith({ subscriptions: [] });
    spy.mockRestore();
  });

  it('extracts subscriptions from client helpers', async () => {
    const spy = jest
      .spyOn(chatAPI, 'registerSubscriptions')
      .mockResolvedValue({ subscriptions: [] });

    const pushSubscription = {
      endpoint: 'https://push.example/2',
      keys: { p256dh: 'key', auth: 'auth' },
    };

    await threadsRegisterSubscriptions({
      threads: {
        registerSubscriptions: () => pushSubscription,
      },
    } as any);

    expect(spy).toHaveBeenCalledWith({
      subscriptions: [pushSubscription],
    });
    spy.mockRestore();
  });
});
