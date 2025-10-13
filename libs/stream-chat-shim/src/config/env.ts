const DEV_HTTP_FALLBACK = 'http://127.0.0.1:8000';
const DEV_WS_FALLBACK = 'ws://127.0.0.1:8000';
const DEV_PORT = '8000';

const trimTrailingSlash = (value: string): string => {
  if (!value) return '';
  return value.replace(/\/+$/, '');
};

const readEnv = (key: string): string | undefined => {
  if (typeof process === 'undefined') return undefined;
  const raw = process.env?.[key];
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed ? trimmed : undefined;
};

const formatHost = (host: string): string => {
  if (!host) return '127.0.0.1';
  if (host.includes(':') && !host.startsWith('[') && !host.endsWith(']')) {
    return `[${host}]`;
  }
  return host;
};

const resolveApiBase = (): string => {
  const envValue = readEnv('NEXT_PUBLIC_API_URL');
  if (envValue) {
    return trimTrailingSlash(envValue);
  }

  if (typeof window !== 'undefined') {
    return '';
  }

  return DEV_HTTP_FALLBACK;
};

const resolveWsBase = (): string => {
  const envValue = readEnv('NEXT_PUBLIC_WS_URL');
  if (envValue) {
    return trimTrailingSlash(envValue);
  }

  if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const secure = protocol === 'https:';
    const scheme = secure ? 'wss' : 'ws';
    const host = formatHost(hostname);
    const resolvedPort = port || DEV_PORT;
    const portSegment = resolvedPort ? `:${resolvedPort}` : '';
    return `${scheme}://${host}${portSegment}`;
  }

  return DEV_WS_FALLBACK;
};

export type ChatAuthMode = 'strict' | 'open';

const resolveChatAuthMode = (): ChatAuthMode => {
  const envValue = (readEnv('NEXT_PUBLIC_CHAT_AUTH_MODE') ?? '').toLowerCase();
  if (envValue === 'open') return 'open';
  return 'strict';
};

export const API_BASE = resolveApiBase();
export const WS_BASE = resolveWsBase();
export const CHAT_AUTH_MODE = resolveChatAuthMode();
