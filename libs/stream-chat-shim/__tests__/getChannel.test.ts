import { getChannel } from '../src/getChannel';

describe('getChannel', () => {
  test('throws if channel and type are not provided', async () => {
    await expect(
      getChannel({ client: {} as any })
    ).rejects.toThrowError();
  });

  test('watches channel once when called concurrently', async () => {
    const watch = jest.fn().mockResolvedValue(undefined);
    const channel: any = { id: 'c1', cid: 'messaging:c1', type: 'messaging', watch };
    const client: any = { channel: jest.fn(() => channel) };

    await Promise.all([
      getChannel({ client, channel }),
      getChannel({ client, channel }),
    ]);

    expect(watch).toHaveBeenCalledTimes(1);
  });
});
