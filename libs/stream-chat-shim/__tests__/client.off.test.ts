import { clientOff, clientOn, __TESTING__ } from '../src/client';

type Handler = (...args: any[]) => void;

type TestClient = {
  listeners: Map<string, Set<Handler>>;
  on: (eventType: string, handler: Handler) => { unsubscribe: () => void };
  off: (eventType?: string, handler?: Handler) => void;
  emit: (eventType: string, payload?: unknown) => void;
};

const createTestClient = (): TestClient => {
  const listeners = new Map<string, Set<Handler>>();

  const client: TestClient = {
    listeners,
    on: (eventType, handler) => {
      if (!listeners.has(eventType)) listeners.set(eventType, new Set());
      listeners.get(eventType)!.add(handler);
      return {
        unsubscribe: () => {
          client.off(eventType, handler);
        },
      };
    },
    off: (eventType, handler) => {
      if (!eventType || !handler) return;
      const handlerSet = listeners.get(eventType);
      if (!handlerSet) return;
      handlerSet.delete(handler);
      if (handlerSet.size === 0) {
        listeners.delete(eventType);
      }
    },
    emit: (eventType, payload) => {
      listeners.get(eventType)?.forEach((fn) => fn(payload));
    },
  };

  return client;
};

describe('client.off helper', () => {
  it('removes a specific handler while keeping others', () => {
    const client = createTestClient();
    const handlerOne = jest.fn();
    const handlerTwo = jest.fn();

    clientOn(client, 'message.new', handlerOne);
    clientOn(client, 'message.new', handlerTwo);

    client.emit('message.new', {});
    expect(handlerOne).toHaveBeenCalledTimes(1);
    expect(handlerTwo).toHaveBeenCalledTimes(1);

    clientOff(client, 'message.new', handlerOne);
    client.emit('message.new', {});

    expect(handlerOne).toHaveBeenCalledTimes(1);
    expect(handlerTwo).toHaveBeenCalledTimes(2);
  });

  it('removes all handlers for an event when only the event is provided', () => {
    const client = createTestClient();
    const first = jest.fn();
    const second = jest.fn();

    clientOn(client, 'message.new', first);
    clientOn(client, 'message.new', second);

    clientOff(client, 'message.new');

    client.emit('message.new', {});
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
    expect(client.listeners.has('message.new')).toBe(false);
  });

  it('removes all handlers across events when called without arguments', () => {
    const client = createTestClient();
    const handler = jest.fn();
    const otherHandler = jest.fn();

    clientOn(client, 'message.new', handler);
    clientOn(client, 'typing.start', otherHandler);

    clientOff(client);

    client.emit('message.new', {});
    client.emit('typing.start', {});

    expect(handler).not.toHaveBeenCalled();
    expect(otherHandler).not.toHaveBeenCalled();
    expect(client.listeners.size).toBe(0);
  });

  it('is a no-op when removing an unregistered handler', () => {
    const client = createTestClient();
    const registered = jest.fn();
    const unregistered = jest.fn();

    clientOn(client, 'message.new', registered);

    expect(() => clientOff(client, 'message.new', unregistered)).not.toThrow();

    client.emit('message.new', {});
    expect(registered).toHaveBeenCalledTimes(1);
  });

  it('does not retain handlers after they are removed', () => {
    const client = createTestClient();
    const handler = jest.fn();

    clientOn(client, 'message.new', handler);
    expect(__TESTING__.getTrackedHandlers(client).length).toBe(1);

    clientOff(client, 'message.new');

    expect(__TESTING__.getTrackedHandlers(client).length).toBe(0);
  });
});
