jest.mock(
  'react',
  () => ({ useSyncExternalStore: jest.fn() }),
  { virtual: true },
);

import { loadMessageIntoChannelState } from '../src/chatSDKShim';

describe('loadMessageIntoChannelState', () => {
  const createChannel = () => {
    const channelState = {
      messages: [] as Array<Record<string, unknown>>,
      messagePagination: {},
    };
    const dispatch = jest.fn();
    return {
      cid: 'messaging:123',
      state: channelState,
      stateStore: { dispatch },
    } as any;
  };

  const baseApiMessage = {
    id: 42,
    body: 'hello world',
    created_at: '2024-01-01T00:00:00.000Z',
    sent_by: 'user-1',
  };

  it('adds messages to the channel state and dispatches updates', async () => {
    const channel = createChannel();

    const normalized = await loadMessageIntoChannelState(channel as any, baseApiMessage);

    expect(normalized.id).toBe('42');
    expect(channel.state?.messages).toHaveLength(1);
    expect(channel.state?.messages?.[0]).toMatchObject({
      id: '42',
      text: 'hello world',
      user: { id: 'user-1' },
    });
    expect(channel.stateStore?.dispatch).toHaveBeenCalledWith({
      messages: channel.state?.messages,
      messagePagination: {},
    });
  });

  it('merges updates by message id without duplicating entries', async () => {
    const channel = createChannel();

    await loadMessageIntoChannelState(channel as any, baseApiMessage);

    const updated = await loadMessageIntoChannelState(channel as any, {
      ...baseApiMessage,
      body: 'updated body',
    });

    expect(channel.state?.messages).toHaveLength(1);
    expect(updated.text).toBe('updated body');
    expect(channel.state?.messages?.[0]).toMatchObject({
      id: '42',
      text: 'updated body',
    });
  });

  it('accepts normalized messages and preserves existing fields', async () => {
    const channel = createChannel();

    await loadMessageIntoChannelState(channel as any, baseApiMessage);

    const normalizedInput = {
      ...(channel.state?.messages?.[0] as Record<string, unknown>),
      id: '42',
      cid: channel.cid,
      text: 'normalized update',
      custom: 'value',
    };

    await loadMessageIntoChannelState(channel as any, normalizedInput);

    expect(channel.state?.messages).toHaveLength(1);
    expect(channel.state?.messages?.[0]).toMatchObject({
      id: '42',
      text: 'normalized update',
      custom: 'value',
    });
    expect(typeof (channel.state as any)?.loadMessageIntoState).toBe('function');

    const loader = (channel.state as any).loadMessageIntoState!;
    await loader({
      ...baseApiMessage,
      body: 'loader body',
    });

    expect(channel.state?.messages?.[0]).toMatchObject({
      id: '42',
      text: 'loader body',
    });
  });
});
