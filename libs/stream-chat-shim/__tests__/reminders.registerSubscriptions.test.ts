jest.mock('react', () => ({}), { virtual: true });

import { remindersRegisterSubscriptions } from '../src/chatSDKShim';
import { chatAPI } from '../src/api/chatAPI';

describe('remindersRegisterSubscriptions', () => {
  it('registers via chatAPI helper', async () => {
    const spy = jest
      .spyOn(chatAPI, 'registerSubscriptions')
      .mockResolvedValue({ subscriptions: [] });

    await remindersRegisterSubscriptions();

    expect(spy).toHaveBeenCalledWith({ subscriptions: [] });
    spy.mockRestore();
  });

  it('normalizes subscriptions returned by client helpers', async () => {
    const spy = jest
      .spyOn(chatAPI, 'registerSubscriptions')
      .mockResolvedValue({ subscriptions: [] });

    const fakeSubscription = {
      endpoint: 'https://push.example/1',
      keys: { p256dh: 'p', auth: 'a' },
      expirationTime: 42,
    };

    await remindersRegisterSubscriptions({
      reminders: {
        registerSubscriptions: () => ({
          subscriptions: [fakeSubscription],
          client_id: 'abc',
          platform: 'web',
        }),
      },
    } as any);

    expect(spy).toHaveBeenCalledWith({
      subscriptions: [fakeSubscription],
      client_id: 'abc',
      platform: 'web',
    });
    spy.mockRestore();
  });
});
