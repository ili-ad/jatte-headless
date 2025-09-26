export type EventTargetLike = {
  on?: (
    eventType: string,
    handler: (...args: any[]) => void,
  ) => { unsubscribe?: () => void } | void;
  off?: (eventType?: string, handler?: (...args: any[]) => void) => void;
  listeners?: unknown;
};

type Handler = (...args: any[]) => void;

type SubscriptionRecord = {
  handler: Handler;
  unsubscribe: () => void;
};

export type ChannelEventSubscription = { unsubscribe: () => void };

const noopSubscription: ChannelEventSubscription = { unsubscribe: () => {} };

const registry = new WeakMap<EventTargetLike, Map<string, Set<SubscriptionRecord>>>();

const getOrCreateSet = (target: EventTargetLike, eventType: string): Set<SubscriptionRecord> => {
  let map = registry.get(target);
  if (!map) {
    map = new Map();
    registry.set(target, map);
  }
  let set = map.get(eventType);
  if (!set) {
    set = new Set();
    map.set(eventType, set);
  }
  return set;
};

const removeRecord = (target: EventTargetLike, eventType: string, record: SubscriptionRecord) => {
  const map = registry.get(target);
  if (!map) return;
  const set = map.get(eventType);
  if (!set) return;
  set.delete(record);
  if (set.size === 0) {
    map.delete(eventType);
  }
  if (map.size === 0) {
    registry.delete(target);
  }
};

const callNativeOff = (
  target: EventTargetLike,
  eventType?: string,
  handler?: Handler,
): void => {
  if (typeof target.off !== 'function') return;
  if (eventType === undefined) {
    target.off();
    return;
  }
  if (handler === undefined) {
    target.off(eventType);
    return;
  }
  target.off(eventType, handler);
};

const extractHandlers = (
  target: EventTargetLike,
  eventType?: string,
): Array<[string, Handler[]]> => {
  const container = (target as { listeners?: unknown }).listeners;
  if (!container) return [];

  const result: Array<[string, Handler[]]> = [];

  if (container instanceof Map) {
    const events = eventType !== undefined ? [eventType] : Array.from(container.keys());
    for (const evt of events) {
      const value = container.get(evt);
      if (!value) continue;
      if (Array.isArray(value)) {
        const handlers = value.filter((fn): fn is Handler => typeof fn === 'function');
        if (handlers.length) result.push([evt, [...handlers]]);
      } else if (value instanceof Set) {
        const handlers = Array.from(value).filter((fn): fn is Handler => typeof fn === 'function');
        if (handlers.length) result.push([evt, handlers]);
      }
    }
    return result;
  }

  if (typeof container === 'object' && container !== null) {
    const record = container as Record<string, unknown>;
    const events = eventType !== undefined ? [eventType] : Object.keys(record);
    for (const evt of events) {
      const value = record[evt];
      if (!value) continue;
      if (Array.isArray(value)) {
        const handlers = value.filter((fn): fn is Handler => typeof fn === 'function');
        if (handlers.length) result.push([evt, [...handlers]]);
      } else if (value instanceof Set) {
        const handlers = Array.from(value).filter((fn): fn is Handler => typeof fn === 'function');
        if (handlers.length) result.push([evt, handlers]);
      }
    }
  }

  return result;
};

const removeTrackedHandlers = (
  target: EventTargetLike,
  eventType?: string,
  predicate?: (record: SubscriptionRecord) => boolean,
): boolean => {
  const map = registry.get(target);
  if (!map) return false;

  const events = eventType !== undefined ? [eventType] : Array.from(map.keys());
  let removed = false;

  for (const evt of events) {
    const set = map.get(evt);
    if (!set || set.size === 0) continue;
    for (const record of Array.from(set)) {
      if (predicate && !predicate(record)) continue;
      record.unsubscribe();
      removed = true;
    }
  }

  return removed;
};

export const createSubscription = (
  target: EventTargetLike | undefined,
  eventType: string,
  handler: Handler,
): ChannelEventSubscription => {
  if (!target || typeof target.on !== 'function') {
    return noopSubscription;
  }

  const maybeSubscription = target.on(eventType, handler);
  let unsubscribed = false;

  const record: SubscriptionRecord = {
    handler,
    unsubscribe: () => {
      if (unsubscribed) return;
      unsubscribed = true;

      if (
        maybeSubscription &&
        typeof maybeSubscription === 'object' &&
        typeof (maybeSubscription as { unsubscribe?: () => void }).unsubscribe === 'function'
      ) {
        (maybeSubscription as { unsubscribe: () => void }).unsubscribe();
      } else if (typeof target.off === 'function') {
        target.off(eventType, handler);
      }

      removeRecord(target, eventType, record);
    },
  };

  getOrCreateSet(target, eventType).add(record);

  return {
    unsubscribe: record.unsubscribe,
  };
};

export const clientOn = (
  client: EventTargetLike | undefined,
  eventType: string,
  handler: Handler,
): ChannelEventSubscription => createSubscription(client, eventType, handler);

export const clientOff = (
  client: EventTargetLike | undefined,
  eventType?: string,
  handler?: Handler,
): void => {
  if (!client) return;

  const predicate = handler ? (record: SubscriptionRecord) => record.handler === handler : undefined;
  const removedTracked = removeTrackedHandlers(client, eventType, predicate);

  if (handler) {
    callNativeOff(client, eventType, handler);
    return;
  }

  if (eventType) {
    const fallbackHandlers = extractHandlers(client, eventType);
    if (fallbackHandlers.length === 0 && !removedTracked) {
      callNativeOff(client, eventType);
      return;
    }

    for (const [, handlers] of fallbackHandlers) {
      for (const fn of handlers) {
        callNativeOff(client, eventType, fn);
      }
    }

    return;
  }

  const fallbackHandlers = extractHandlers(client);
  if (fallbackHandlers.length === 0 && !removedTracked) {
    callNativeOff(client);
    return;
  }

  for (const [evt, handlers] of fallbackHandlers) {
    for (const fn of handlers) {
      callNativeOff(client, evt, fn);
    }
  }
};

export const __TESTING__ = {
  getTrackedHandlers(target: EventTargetLike, eventType?: string): Handler[] {
    const map = registry.get(target);
    if (!map) return [];
    if (eventType !== undefined) {
      const set = map.get(eventType);
      if (!set) return [];
      return Array.from(set).map((record) => record.handler);
    }

    const handlers: Handler[] = [];
    for (const set of map.values()) {
      for (const record of set) {
        handlers.push(record.handler);
      }
    }
    return handlers;
  },
};
