import type {
  RealtimeCredentialProvider,
  RealtimeSocket,
  RealtimeSocketCloseEvent,
  RealtimeSocketMessageEvent,
} from '@iliad/realtime';

import { resolveWsBase } from '../../config/endpoints';

export type JatteRealtimeEvent = Record<string, unknown> & { type: string };

export interface RawWebSocketLike {
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: (() => void) | null;
  onclose: ((event: { code: number; wasClean?: boolean }) => void) | null;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

export type RawWebSocketConstructor = new (url: string) => RawWebSocketLike;

export function createJatteCredentialProvider(client: {
  readonly userToken: string | null;
  refreshToken(): Promise<string>;
}): RealtimeCredentialProvider {
  return {
    async getCredential() {
      const credential = client.userToken;
      if (!credential) throw new Error('Jatte realtime credential unavailable');
      return credential;
    },
    refreshCredential: () => client.refreshToken(),
  };
}

export function buildJatteSocketUrl(credential: string, cid: string): string {
  return `${resolveWsBase()}/ws/${cid}/?token=${encodeURIComponent(credential)}`;
}

export function createJatteRealtimeSocket(options: {
  credential: string;
  cid: string;
  WebSocketCtor?: RawWebSocketConstructor;
}): RealtimeSocket {
  const WebSocketCtor = options.WebSocketCtor ?? (WebSocket as unknown as RawWebSocketConstructor);
  const raw = new WebSocketCtor(buildJatteSocketUrl(options.credential, options.cid));
  const facade: RealtimeSocket = {
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
    close: (code, reason) => raw.close(code, reason),
  };

  raw.onopen = () => {
    try {
      raw.send(JSON.stringify({ type: 'channel.watch', cid: options.cid }));
    } catch {
      raw.close(1011, 'watch_handshake_failed');
      return;
    }
    facade.onopen?.();
  };
  raw.onmessage = event => facade.onmessage?.({ data: event.data } as RealtimeSocketMessageEvent);
  raw.onerror = () => facade.onerror?.();
  raw.onclose = event => facade.onclose?.({ code: event.code, wasClean: event.wasClean });
  return facade;
}

export function decodeRealtimeEvent(raw: unknown): JatteRealtimeEvent | null {
  if (typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const type = (parsed as { type?: unknown }).type;
    return typeof type === 'string' && type.length > 0
      ? parsed as JatteRealtimeEvent
      : null;
  } catch {
    return null;
  }
}

export function shouldReconnectJatte(event: RealtimeSocketCloseEvent): boolean {
  return ![1000, 1009, 4408].includes(event.code);
}

export function shouldRefreshJatteCredential(event: RealtimeSocketCloseEvent): boolean {
  return event.code === 4401;
}
