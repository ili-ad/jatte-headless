//frontend/src/lib/ChatProvider.tsx
'use client';

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Channel as ChannelType, ChatClient } from './stream-adapter';
import { Channel as AdapterChannel } from './stream-adapter';
import { getStreamClient } from './getStreamClient';
import { getChatCreds } from './getChatCreds';
import { setAuthToken } from '@iliad/stream-chat-shim';
import { useSession } from './SessionProvider';
import { AuthError } from './errors';
import { MAX_BOOTSTRAP_ATTEMPTS } from '../chat-kit/lib/bootstrapFetchPolicy';
import { nextDelayMs, shouldRetry } from '../chat-kit/lib/bootstrapFetchPolicy';
import { setAccessToken } from './authTokenStore';
import { apiFetch } from './api';

export const chatClient: ChatClient = getStreamClient();

const ROOM_UUID_COOKIE_PREFIX = 'jatte.room_uuid.';
const ROOM_UUID_COOKIE_MAX_AGE_DAYS = 60;

function cookieKeyForLabel(label: string) {
  return `${ROOM_UUID_COOKIE_PREFIX}${label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function getCookie(name: string) {
  const cookies = typeof document !== 'undefined' ? document.cookie.split(';') : [];
  for (const raw of cookies) {
    const [key, ...rest] = raw.trim().split('=');
    if (decodeURIComponent(key) === name) {
      return decodeURIComponent(rest.join('=') ?? '');
    }
  }
  return null;
}

function setCookie(name: string, value: string, maxAgeDays = ROOM_UUID_COOKIE_MAX_AGE_DAYS) {
  const expires = new Date(Date.now() + maxAgeDays * 24 * 60 * 60 * 1000);
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; expires=${expires.toUTCString()}`;
}

export type BootstrapStatus =
  | { kind: 'connecting' }
  | { kind: 'retrying'; attempt: number; retryInMs: number }
  | { kind: 'ready' }
  | { kind: 'error'; code?: number; message: string; retryable: boolean };

interface ChatContextValue {
  client: ChatClient | null;
  channel: ChannelType | null;
  roomConfig: Record<string, any> | null;
  bootstrapStatus: BootstrapStatus;
  retryBootstrap: () => void;
}

const ChatContext = createContext<ChatContextValue>({
  client: null,
  channel: null,
  roomConfig: null,
  bootstrapStatus: { kind: 'connecting' },
  retryBootstrap: () => {},
});

export function useChat() {
  return useContext(ChatContext);
}

interface ChatProviderProps {
  children: ReactNode;
  roomSlug?: string;
}

export function ChatProvider({ children, roomSlug = 'general' }: ChatProviderProps) {
  const { session } = useSession();
  const [client] = useState<ChatClient>(() => chatClient);
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [roomUuid, setRoomUuid] = useState<string | null>(null);
  const [roomConfig, setRoomConfig] = useState<Record<string, any> | null>(null);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>({ kind: 'connecting' });
  const [bootstrapRunId, setBootstrapRunId] = useState(0);

  const retryBootstrap = useCallback(() => setBootstrapRunId((id) => id + 1), []);

  useEffect(() => {
    let cancelled = false;
    const label = roomSlug;
    const cookieKey = cookieKeyForLabel(label);

    setRoomUuid(null);
    setRoomConfig(null);
    setBootstrapStatus({ kind: 'connecting' });

    const cachedUuid = getCookie(cookieKey);
    if (cachedUuid) {
      setRoomUuid(cachedUuid);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const res = await apiFetch('/rooms/resolve/', {
          method: 'POST',
          body: JSON.stringify({ label }),
        });

        if (!res.ok) {
          throw new Error(`resolve failed with status ${res.status}`);
        }

        const data = await res.json().catch(() => ({}));
        const uuid = data?.room_uuid ?? data?.uuid;

        if (!uuid) {
          throw new Error('resolve response missing room_uuid');
        }

        if (cancelled) return;

        setCookie(cookieKey, uuid);
        setRoomUuid(uuid);
      } catch (err) {
        console.error('[ChatProvider] failed to resolve room', err);
        if (!cancelled) {
          setBootstrapStatus({
            kind: 'error',
            message: 'Could not start chat. Please try again.',
            retryable: true,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomSlug, bootstrapRunId]);

  useEffect(() => {
    let mounted = true;

    // When the Supabase session is gone, tear down the channel and (optionally) disconnect.
    if (!session || !roomUuid) {
      setChannel(null);
      setRoomConfig(null);
      setBootstrapStatus((status) => {
        if (status.kind === 'error' && !roomUuid) {
          return status;
        }
        return { kind: 'connecting' };
      });
      setAuthToken(null);
      setAccessToken(null);

      const maybeDisconnect = (client as any).disconnectUser;
      if (typeof maybeDisconnect === 'function') {
        try {
          maybeDisconnect.call(client);
        } catch (err) {
          console.error('[ChatProvider] disconnectUser failed', err);
        }
      }

      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        const { userID, userToken } = await getChatCreds();
        setAuthToken(userToken);
        setAccessToken(userToken);

        // Try to use the adapter’s connectUser if it exists.
        const maybeConnect = (client as any).connectUser;
        if (typeof maybeConnect === 'function') {
          await maybeConnect.call(client, { id: String(userID) }, userToken);
        } else {
          // Fallback: at least tag the user on the client so the adapter
          // and channel have something to work with.
          (client as any).user = { id: String(userID) };
        }

        // The adapter’s Channel uses client['jwt'] when hitting your backend & ws.
        (client as any).jwt = userToken;

        // Guard against client.channel being missing, to avoid hard crashes.
        const channelFactory = (client as any).channel;
        if (typeof channelFactory !== 'function') {
          console.error('[ChatProvider] client.channel is not a function', { client });
          return;
        }

        const chan = channelFactory.call(client, 'messaging', roomUuid) as AdapterChannel;
        chan.data = { ...chan.data, name: roomSlug };
        await chan.watch();

        console.info('[ChatProvider] channel created', {
          isAdapterChannel: chan instanceof AdapterChannel,
          channelClass: chan.constructor?.name,
          clientClass: client.constructor?.name,
        });

        if (!mounted) return;
        setChannel(chan);
      } catch (err) {
        console.error('[ChatProvider] failed to initialize chat client/channel', err);
        setAuthToken(null);
        setAccessToken(null);
        setBootstrapStatus({
          kind: 'error',
          message: 'Could not start chat. Please try again.',
          retryable: true,
        });
      }
    })();

    return () => {
      mounted = false;
      const maybeDisconnect = (client as any).disconnectUser;
      if (typeof maybeDisconnect === 'function') {
        try {
          maybeDisconnect.call(client);
        } catch (err) {
          console.error('[ChatProvider] disconnectUser failed on cleanup', err);
        }
      }
    };
    }, [client, roomSlug, roomUuid, session]);



  useEffect(() => {
    if (!channel) return;
    const handleNew = () => channel.markRead();
    channel.on('message.new', handleNew);
    return () => {
      channel.off('message.new', handleNew);
    };
  }, [channel]);

  useEffect(() => {
    setBootstrapStatus({ kind: 'connecting' });
    setRoomConfig(null);
  }, [channel, bootstrapRunId]);

    useEffect(() => {
    if (!channel || typeof (channel as any).getConfigState !== 'function') return;

    let cancelled = false;
    let attempt = 1;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let countdownTimer: ReturnType<typeof setInterval> | null = null;
    let refreshTimer: ReturnType<typeof setInterval> | null = null;
    let abortController = new AbortController();
    let refreshAbortController: AbortController | null = null;

    const clearTimers = () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (countdownTimer) clearInterval(countdownTimer);
      if (refreshTimer) clearInterval(refreshTimer);
    };

    const toStatusCode = (err: unknown) => {
      if (typeof (err as any)?.status === 'number') return (err as any).status as number;
      if (err instanceof AuthError) return err.status ?? 401;
      return null;
    };

    const setRetryingState = (nextAttempt: number, delayMs: number) => {
      const startedAt = Date.now();
      setBootstrapStatus({ kind: 'retrying', attempt: nextAttempt, retryInMs: delayMs });
      countdownTimer = setInterval(() => {
        const remaining = Math.max(0, delayMs - (Date.now() - startedAt));
        setBootstrapStatus({ kind: 'retrying', attempt: nextAttempt, retryInMs: remaining });
      }, 200);
    };

    const handleTerminalError = (status: number | null, err: unknown, retryable: boolean) => {
      const message =
        status === 401 || status === 403
          ? "You're not authorized to access this room yet."
          : 'Could not load chat configuration.';
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[agent/config] config-state bootstrap failed', { status, err, retryable });
      }
      setBootstrapStatus({
        kind: 'error',
        code: status ?? undefined,
        message,
        retryable,
      });
    };

    const attemptFetch = async () => {
      if (attempt === 1) {
        setBootstrapStatus({ kind: 'connecting' });
      }

      try {
        const config = await (channel as any).getConfigState(attempt > 1, {
          signal: abortController.signal,
        });
        if (cancelled) return;
        setRoomConfig(config ?? null);
        setBootstrapStatus({ kind: 'ready' });

        refreshTimer = setInterval(() => {
          if (cancelled) return;
          refreshAbortController?.abort();
          refreshAbortController = new AbortController();

          void (async () => {
            try {
              const refreshed = await (channel as any).getConfigState(true, {
                signal: refreshAbortController?.signal,
              });
              if (cancelled) return;
              setRoomConfig(refreshed ?? null);
            } catch (err) {
              if (cancelled) return;
              if (err instanceof DOMException && err.name === 'AbortError') {
                return;
              }
              if (process.env.NODE_ENV !== 'production') {
                // eslint-disable-next-line no-console
                console.warn('[agent/config] background config-state refresh failed', err);
              }
            }
          })();
        }, 90_000);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        const status = toStatusCode(err);
        const retryable = shouldRetry(status, err);

        if (!retryable || attempt >= MAX_BOOTSTRAP_ATTEMPTS) {
          handleTerminalError(status, err, retryable);
          return;
        }

        const delayMs = nextDelayMs(attempt);
        setRetryingState(attempt + 1, delayMs);
        attempt += 1;
        retryTimeout = setTimeout(() => {
          abortController.abort();
          abortController = new AbortController();
          if (countdownTimer) clearInterval(countdownTimer);
          void attemptFetch();
        }, delayMs);
      }
    };

    void attemptFetch();

    return () => {
      cancelled = true;
      abortController.abort();
      refreshAbortController?.abort();
      clearTimers();
    };
  }, [channel, bootstrapRunId]);

  const contextValue = useMemo(
    () => ({ client, channel, roomConfig, bootstrapStatus, retryBootstrap }),
    [bootstrapStatus, channel, client, retryBootstrap, roomConfig],
  );

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}
