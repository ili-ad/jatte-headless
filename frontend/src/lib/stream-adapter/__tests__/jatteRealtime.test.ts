import { createRealtimeClient, type RealtimeDiagnostic } from '@iliad/realtime';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createJatteCredentialProvider,
  createJatteRealtimeSocket,
  decodeRealtimeEvent,
  shouldReconnectJatte,
  shouldRefreshJatteCredential,
  type JatteRealtimeEvent,
  type RawWebSocketLike,
} from '../jatteRealtime';

class FakeRawSocket implements RawWebSocketLike {
  static instances: FakeRawSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((event: { code: number; wasClean?: boolean }) => void) | null = null;
  sent: string[] = [];
  closed: Array<[number | undefined, string | undefined]> = [];

  constructor(readonly url: string) { FakeRawSocket.instances.push(this); }
  send(data: string) { this.sent.push(data); }
  close(code?: number, reason?: string) { this.closed.push([code, reason]); }
  open() { this.onopen?.(); }
  message(data: unknown) { this.onmessage?.({ data }); }
  closeFromServer(code: number, wasClean = false) { this.onclose?.({ code, wasClean }); }
}

class FailingWatchSocket extends FakeRawSocket {
  send() { throw new Error('watch failed'); }
}

function harness(overrides: {
  credential?: string | null;
  refresh?: () => Promise<string>;
  resync?: () => Promise<void>;
} = {}) {
  let credential = overrides.credential === undefined ? 'jwt-one' : overrides.credential;
  const order: string[] = [];
  const events: JatteRealtimeEvent[] = [];
  const diagnostics: RealtimeDiagnostic[] = [];
  const refresh = vi.fn(overrides.refresh ?? (async () => {
    credential = 'jwt-two';
    order.push('refresh');
    return credential;
  }));
  const provider = createJatteCredentialProvider({
    get userToken() { return credential; },
    refreshToken: refresh,
  });
  const client = createRealtimeClient<JatteRealtimeEvent>({
    credentialProvider: provider,
    createSocket: ({ credential: token }) => {
      order.push(`socket:${token}`);
      return createJatteRealtimeSocket({
        credential: token,
        cid: 'messaging:room-1',
        WebSocketCtor: FakeRawSocket,
      });
    },
    decodeEvent: decodeRealtimeEvent,
    resync: async () => {
      order.push('resync:start');
      await (overrides.resync?.() ?? Promise.resolve());
      order.push('resync:end');
    },
    shouldReconnect: shouldReconnectJatte,
    shouldRefreshCredential: shouldRefreshJatteCredential,
    reconnect: { maxAttempts: 2, initialDelayMs: 10, maximumDelayMs: 20, multiplier: 2, jitterRatio: 0 },
  });
  client.subscribe(event => events.push(event));
  client.subscribeDiagnostics(event => diagnostics.push(event));
  return { client, diagnostics, events, order, refresh };
}

afterEach(() => {
  FakeRawSocket.instances = [];
  vi.useRealTimers();
});

describe('Jatte realtime lifecycle adapter', () => {
  it('acquires one credential and sends one watch before connected', async () => {
    const { client } = harness();
    await client.start();
    const socket = FakeRawSocket.instances[0];
    expect(client.state()).toBe('connecting');
    socket.open();
    expect(socket.sent).toEqual([JSON.stringify({ type: 'channel.watch', cid: 'messaging:room-1' })]);
    expect(client.state()).toBe('connected');
    await client.start();
    expect(FakeRawSocket.instances).toHaveLength(1);
  });

  it('does not report connected when the watch handshake cannot be sent', () => {
    const socket = createJatteRealtimeSocket({
      credential: 'jwt-one',
      cid: 'messaging:room-1',
      WebSocketCtor: FailingWatchSocket,
    });
    const opened = vi.fn();
    socket.onopen = opened;
    FakeRawSocket.instances[0].open();
    expect(opened).not.toHaveBeenCalled();
    expect(FakeRawSocket.instances[0].closed).toEqual([[1011, 'watch_handshake_failed']]);
  });

  it('fails closed when no credential is available', async () => {
    const { client } = harness({ credential: null });
    await client.start();
    expect(client.state()).toBe('degraded');
    expect(FakeRawSocket.instances).toHaveLength(0);
  });

  it('resyncs before constructing a replacement and fences stale messages', async () => {
    vi.useFakeTimers();
    const { client, events, order } = harness();
    await client.start();
    const oldSocket = FakeRawSocket.instances[0];
    oldSocket.open();
    oldSocket.closeFromServer(1006);
    await vi.advanceTimersByTimeAsync(10);
    expect(order).toEqual(['socket:jwt-one', 'resync:start', 'resync:end', 'socket:jwt-one']);
    const replacement = FakeRawSocket.instances[1];
    replacement.open();
    expect(replacement.sent).toHaveLength(1);
    oldSocket.message(JSON.stringify({ type: 'message.new', message: { id: 'stale' } }));
    replacement.message(JSON.stringify({ type: 'message.new', message: { id: 'fresh' } }));
    expect(events).toHaveLength(1);
  });

  it('refreshes once for 4401 before resync and replacement', async () => {
    vi.useFakeTimers();
    const { client, order, refresh } = harness();
    await client.start();
    FakeRawSocket.instances[0].open();
    FakeRawSocket.instances[0].closeFromServer(4401);
    await vi.advanceTimersByTimeAsync(10);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['socket:jwt-one', 'refresh', 'resync:start', 'resync:end', 'socket:jwt-two']);
  });

  it.each([1000, 1009, 4408])('does not reconnect terminal close %s', async code => {
    vi.useFakeTimers();
    const { client } = harness();
    await client.start();
    FakeRawSocket.instances[0].open();
    FakeRawSocket.instances[0].closeFromServer(code);
    await vi.runAllTimersAsync();
    expect(FakeRawSocket.instances).toHaveLength(1);
    expect(client.state()).toBe('disconnected');
  });

  it('degrades without replacement when refresh fails', async () => {
    vi.useFakeTimers();
    const { client } = harness({ refresh: async () => { throw new Error('refresh failed'); } });
    await client.start();
    FakeRawSocket.instances[0].open();
    FakeRawSocket.instances[0].closeFromServer(4401);
    await vi.advanceTimersByTimeAsync(10);
    expect(client.state()).toBe('degraded');
    expect(FakeRawSocket.instances).toHaveLength(1);
  });

  it('degrades without replacement when strict resync fails', async () => {
    vi.useFakeTimers();
    const { client } = harness({ resync: async () => { throw new Error('resync failed'); } });
    await client.start();
    FakeRawSocket.instances[0].open();
    FakeRawSocket.instances[0].closeFromServer(1006);
    await vi.advanceTimersByTimeAsync(10);
    expect(client.state()).toBe('degraded');
    expect(FakeRawSocket.instances).toHaveLength(1);
  });

  it('rejects malformed events and isolates handler failures without leaking credentials', async () => {
    const { client, diagnostics } = harness();
    client.subscribe(() => { throw new Error('consumer'); });
    await client.start();
    const socket = FakeRawSocket.instances[0];
    socket.open();
    socket.message('not-json');
    socket.message(JSON.stringify({ type: 'message.new' }));
    expect(diagnostics.map(item => item.type)).toContain('event_rejected');
    expect(diagnostics.map(item => item.type)).toContain('event_handler_failed');
    expect(JSON.stringify(diagnostics)).not.toContain('jwt-one');
  });

  it('cancels backoff and rejects post-stop callbacks', async () => {
    vi.useFakeTimers();
    const { client, events } = harness();
    await client.start();
    const socket = FakeRawSocket.instances[0];
    socket.open();
    socket.closeFromServer(1006);
    client.stop();
    socket.message(JSON.stringify({ type: 'message.new' }));
    await vi.runAllTimersAsync();
    expect(FakeRawSocket.instances).toHaveLength(1);
    expect(events).toHaveLength(0);
  });
});
