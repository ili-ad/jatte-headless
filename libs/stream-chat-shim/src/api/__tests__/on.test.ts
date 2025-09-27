import { chatAPI } from '../chatAPI';
import { StreamChat } from 'chat-shim';

const emitEvent = (client: StreamChat, type: string, event: Record<string, unknown>) => {
  const payload = { type, ...event };
  (client as unknown as { emit: (eventType: string, data: Record<string, unknown>) => void }).emit(
    type,
    payload,
  );
};

describe('chatAPI.on', () => {
  it('notifies listener for a single event', () => {
    const client = new StreamChat('single-event');
    const listener = jest.fn();

    const unsubscribe = chatAPI.on('message.new', listener, { client });

    const eventPayload = {
      cid: 'messaging:test-room',
      channel_id: 'test-room',
      message: { id: '42' },
    } satisfies Record<string, unknown>;

    emitEvent(client, 'message.new', eventPayload);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining(eventPayload));

    unsubscribe();
  });

  it('only reacts to the subscribed event types', () => {
    const client = new StreamChat('multi-event');
    const listener = jest.fn();

    const unsubscribe = chatAPI.on(['message.new', 'message.updated'], listener, { client });

    emitEvent(client, 'message.new', {});
    emitEvent(client, 'reaction.new', {});
    emitEvent(client, 'message.updated', {});

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls.map((call) => call[0].type)).toEqual([
      'message.new',
      'message.updated',
    ]);

    unsubscribe();
  });

  it('filters channel-scoped subscriptions by cid and channelId', () => {
    const client = new StreamChat('channel-filter');
    const listener = jest.fn();

    const unsubscribe = chatAPI.on('message.new', listener, {
      client,
      cid: 'messaging:room-target',
      channelId: 'room-target',
    });

    emitEvent(client, 'message.new', {
      cid: 'messaging:room-other',
      channel_id: 'room-other',
    });
    emitEvent(client, 'message.new', {
      cid: 'messaging:room-target',
      channel_id: 'room-target',
    });
    emitEvent(client, 'message.new', {
      cid: 'messaging:room-target',
    });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls.map((call) => call[0].cid)).toEqual([
      'messaging:room-target',
      'messaging:room-target',
    ]);

    unsubscribe();
  });

  it('unsubscribe detaches only the registered listener', () => {
    const client = new StreamChat('unsubscribe');
    const first = jest.fn();
    const second = jest.fn();

    const unsubscribeFirst = chatAPI.on('message.new', first, { client });
    const unsubscribeSecond = chatAPI.on('message.new', second, { client });

    unsubscribeFirst();

    emitEvent(client, 'message.new', {});

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    unsubscribeSecond();
  });
});
