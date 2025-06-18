import mitt from 'mitt';
import { MiniStore } from './MiniStore';
import { Channel } from './Channel';
import { API, EVENTS } from './constants';
import { TokenManager } from './tokenManager';

const randomId = () => Math.random().toString(36).slice(2);
import type { Room, ChatEvents, AppSettings, User, Message } from './types';

/* ------------------------------------------------------------------ */
/* High-level client wrapper that Stream-UI talks to                  */
/* ------------------------------------------------------------------ */

export class ChatClient {
    // `id` will be filled by connectUser; start blank
    readonly user: { id: string | null };
    /** copy of the full user object returned from backend */
    _user: User | null = null;
    private emitter = mitt<ChatEvents>();
    /* ---------- fields Stream-UI pokes at ---------- */
    /** Populated by connectUser, nulled by disconnectUser */


    /** Random identifier for this client (regenerated on connectUser) */
    clientID: string;
    /** Unique ID for the current connection (null until connected) */
    connectionId: string | null = null;
    /** Whether the client is currently disconnected */
    disconnected = true;
    /** Whether the client finished initialization */
    initialized = false;
    /** Promise resolving when websocket auth completes */
    wsPromise: Promise<void> | null = null;

    private userAgent = 'custom-chat-client/0.0.1 stream-chat-react-adapter';
    tokenManager: TokenManager;
    activeChannels: Record<string, any> = {};
    mutedChannels: unknown[] = [];
    mutedUsers: unknown[] = [];
    listeners: Record<string, any[]> = {};

    /** Minimal client.state stub holding fetched users */
    state = { users: {} as Record<string, User> };

    /** global stores Stream-UI subscribes to */
    readonly stateStore = new MiniStore({ channels: [] as Channel[] });
    readonly settingsStore = new MiniStore<AppSettings | null>(null);
    private bus = mitt();

    /* feature-module placeholders Stream-UI imports & tears-down */
    threads   !: {
        state: MiniStore<{
            threads: any[];
            unseenThreadIds: string[];
            unreadThreadCount: number;
            pagination: { isLoadingNext: boolean };
        }>;
        registerSubscriptions(): void; unregisterSubscriptions(): void;
        reload(): Promise<any>; loadNextPage(): Promise<any>;
        activate(): void; deactivate(): void;
    };
    polls     !: { store: MiniStore<{ polls: any[] }>; registerSubscriptions(): void; unregisterSubscriptions(): void };
    reminders !: {
        store: MiniStore<{ reminders: any[] }>;
        registerSubscriptions(): void; unregisterSubscriptions(): void;
        initTimers(): void; clearTimers(): void;
    };

    /* 🔹 NEW: notifications — only `.store` is required for now */
    notifications!: { store: MiniStore<{ notifications: any[] }> };

    /** Minimal axios-like helper used by Stream-UI */
    axiosInstance = {
        get: async (url: string, config: { headers?: Record<string, string> } = {}) => {
            const res = await fetch(url, { method: 'GET', headers: this.buildHeaders(config.headers) });
            const data = await res.json().catch(() => null);
            return { data, status: res.status, statusText: res.statusText };
        },
        post: async (url: string, data: any, config: { headers?: Record<string, string> } = {}) => {
            const res = await fetch(url, {
                method: 'POST',
                headers: this.buildHeaders({ 'Content-Type': 'application/json', ...(config.headers || {}) }),
                body: JSON.stringify(data ?? {}),
            });
            const body = await res.json().catch(() => null);
            return { data: body, status: res.status, statusText: res.statusText };
        },
        delete: async (url: string, config: { headers?: Record<string, string> } = {}) => {
            const res = await fetch(url, { method: 'DELETE', headers: this.buildHeaders(config.headers) });
            const body = await res.json().catch(() => null);
            return { data: body, status: res.status, statusText: res.statusText };
        },
    };

    /* ----------------------------------------------------------- */
    constructor(
        private userId: string | null = null,
        private jwt: string | null = null,
    ) {
        this.user = { id: userId };
        if (userId) this._user = { id: userId } as any;
        this.clientID = randomId();
        this.tokenManager = new TokenManager(jwt || undefined);

        /* Basic threads manager */
        this.threads = {
            state: new MiniStore({
                threads: [] as Message[],
                unseenThreadIds: [] as string[],
                unreadThreadCount: 0,
                pagination: { isLoadingNext: false },
            }),
            registerSubscriptions() {/* noop */ },
            unregisterSubscriptions() {/* noop */ },
            async reload() { await (this as any).getThreads(); },
            async loadNextPage() { await (this as any).getThreads(); },
            activate() {/* noop */ },
            deactivate() {/* noop */ },
        } as any;
        this.polls = {
            store: new MiniStore({ polls: [] as any[] }),
            registerSubscriptions() {/* noop */ },
            unregisterSubscriptions() {/* noop */ },
        };
        this.reminders = {
            store: new MiniStore({ reminders: [] as any[] }),
            registerSubscriptions() {/* noop */ },
            unregisterSubscriptions() {/* noop */ },
            initTimers() {/* noop */ },
            clearTimers() {/* noop */ },
        };

        /* initialise empty notifications store                              */
        // ChatClient.ts  – inside the constructor
        this.notifications = {
            store: new MiniStore({
                notifications: [] as any[],   // 👈  cast to any[]
            }),
        };

    }

    /* ---------- event-bus helpers ---------- */
    on = (event: string, cb: (...args: any[]) => void) => {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(cb);
        this.bus.on(event as any, cb);
    };
    off = (event: string, cb: (...args: any[]) => void) => {
        this.bus.off(event as any, cb);
        const arr = this.listeners[event];
        if (arr) {
            this.listeners[event] = arr.filter(fn => fn !== cb);
            if (this.listeners[event].length === 0) delete this.listeners[event];
        }
    };
    emit = this.bus.emit.bind(this);

    /**
     * Manually dispatch an event to this client and its channels.
     * Only a tiny subset of Stream events is supported.
     */
    dispatchEvent(event: { type: string; cid?: string; message?: Message; user_id?: string }) {
        if (event.cid) {
            const chan = this.activeChannels[event.cid];
            if (chan && typeof (chan as any).dispatchEvent === 'function') {
                (chan as any).dispatchEvent(event);
            }
        }
        this.emit(event.type as any, event as any);
    }

    private buildHeaders(extra: Record<string, string> = {}) {
        return this.jwt ? { Authorization: `Bearer ${this.jwt}`, ...extra } : extra;
    }

    getUserAgent() {
        return this.userAgent;
    }

    setUserAgent(ua: string) {
        this.userAgent = ua;
        if (this.jwt) {
            fetch(API.USER_AGENT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.jwt}`,
                },
                body: JSON.stringify({ user_agent: ua }),
            }).catch(() => { /* ignore network errors */ });
        }
    }

    async refreshToken() {
        const newToken = await this.tokenManager.refreshToken(API.REFRESH_TOKEN);
        this.jwt = newToken;
        return newToken;
    }

    /** Return the currently connected user's ID, if any */
    get userID() {
        return this.userId;
    }

    /** Return the JWT token currently in use, if any */
    get userToken() {
        return this.jwt;
    }

    /** Initialize the client for a given user */
    /**
     * Register a user and emit the same events Stream’s SDK does.
     * Resolves only on successful sync.
     */
    async connectUser(user: { id: string }, token: string): Promise<void> {
        this.userId = user.id;
        this.jwt = token;
        await this.tokenManager.setTokenOrProvider(token);
        (this as any).user = { id: user.id };
        this.clientID = `${user.id}--${randomId()}`;
        try {
            const cidRes = await fetch(API.CLIENT_ID, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (cidRes.ok) {
                const cidBody = await cidRes.json().catch(() => null);
                if (cidBody && cidBody.client_id) {
                    this.clientID = `${user.id}--${cidBody.client_id}`;
                }
            }
        } catch {
            /* ignore network errors */
        }
        const res = await fetch(API.SYNC_USER, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },

        });
        if (!res.ok) throw new Error('sync-user failed');
        const body = await res.json().catch(() => null);
        if (body) {
            this._user = body;
            this.state.users[String(body.id)] = body;
        }
        this.wsPromise = fetch(API.WS_AUTH, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(() => undefined);
        await this.wsPromise;
        try {
            const cidRes = await fetch(API.CONNECTION_ID, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (cidRes.ok) {
                const cidBody = await cidRes.json().catch(() => null);
                if (cidBody && cidBody.connection_id) {
                    this.connectionId = cidBody.connection_id;
                }
            }
        } catch {
            /* ignore network errors */
        }
        if (!this.connectionId) {
            this.connectionId = crypto.randomUUID();
        }
        this.initialized = true;
        this.disconnected = false;
        this.emit('connection.changed', { online: true });
    }

    /** Tear-down helper mirroring Stream’s client.disconnectUser */
    disconnectUser() {
        const token = this.jwt;
        if (token) {
            fetch(API.SESSION, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => { /* ignore network errors */ });
        }

        this.activeChannels = {};
        this.stateStore._set({ channels: [] });
        delete (this as any).user;
        this._user = null;
        this.userId = null;
        this.jwt = null;
        this.tokenManager.reset();
        this.connectionId = null;
        this.initialized = false;
        this.disconnected = true;
        this.emit('connection.changed', { online: false });
    }

    /* ---------- API that Stream-UI actually calls ---------- */

    /** fetch list of channels for <ChannelList> */
    async queryChannels() {
        const res = await fetch(API.ROOMS, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        const rooms = res.ok ? (await res.json() as Room[]) : [];

        const chans = rooms.map(
            r => new Channel(r.id, r.uuid, r.name ?? r.uuid, this, r.data || {}),
        );
        this.stateStore._set({ channels: chans });
        return chans;
    }

    /** fetch list of users */
    async queryUsers() {
        const res = await fetch(API.USERS, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        if (!res.ok) return [];
        const list = await res.json() as User[];
        for (const u of list) this.state.users[String(u.id)] = u;
        return list;
    }

    /** Fetch the currently authenticated user */
    async getUser() {
        const res = await fetch(API.USER, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        if (!res.ok) throw new Error('user fetch failed');
        const info = await res.json() as User;
        (this as any).user = { id: String(info.id) };
        this._user = info;
        this.state.users[String(info.id)] = info;
        return info;
    }

    /** fetch global app settings */
    async getAppSettings(): Promise<AppSettings> {
        const res = await fetch(API.APP_SETTINGS, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        if (!res.ok) throw new Error('getAppSettings failed');
        const settings: AppSettings = await res.json();
        this.settingsStore._set(settings);
        this.emit(EVENTS.SETTINGS_UPDATED, settings);
        return settings;
    }

    /** fetch notifications for the current user */
    async getNotifications() {
        const res = await fetch(API.NOTIFICATIONS, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        if (!res.ok) throw new Error('getNotifications failed');
        const list = await res.json() as any[];
        this.notifications.store._set({ notifications: list });
        return list;
    }

    /** fetch list of polls */
    async getPolls() {
        const res = await fetch(API.POLLS, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        if (!res.ok) throw new Error('getPolls failed');
        const list = await res.json() as any[];
        this.polls.store._set({ polls: list });
        return list;
    }

    /** fetch list of reminders */
    async getReminders() {
        const res = await fetch(API.REMINDERS, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        if (!res.ok) throw new Error('getReminders failed');
        const list = await res.json() as any[];
        this.reminders.store._set({ reminders: list });
        return list;
    }

    /** fetch list of threads */
    async getThreads() {
        const res = await fetch(API.THREADS, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        if (!res.ok) throw new Error('getThreads failed');
        const list = await res.json() as any[];
        this.threads.state._set({
            threads: list,
            unseenThreadIds: [],
            unreadThreadCount: 0,
            pagination: { isLoadingNext: false },
        });
        return list;
    }

    /** fetch list of users muted by the current user */
    async getMutedUsers() {
        const res = await fetch(API.MUTED_USERS, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        if (!res.ok) throw new Error('getMutedUsers failed');
        const list = await res.json() as any[];
        this.mutedUsers = list;
        return list;
    }

    /** list of currently active channels */
    async getActiveChannels() {
        const res = await fetch(API.ACTIVE_ROOMS, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        const rooms = res.ok ? (await res.json() as Room[]) : [];
        return rooms.map(r => new Channel(r.id, r.uuid, r.name ?? r.uuid, this, r.data || {}));
    }

    /** list of muted channels for the current user */
    async getMutedChannels() {
        const res = await fetch(API.MUTED_CHANNELS, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        if (!res.ok) throw new Error('getMutedChannels failed');
        const rooms = await res.json() as Room[];
        this.mutedChannels = rooms.map(
            r => new Channel(r.id, r.uuid, r.name ?? r.uuid, this, r.data || {})
        );
        return this.mutedChannels;
    }

    /** Check if a given user is muted */
    async muteStatus(userId: string) {
        const res = await fetch(`${API.MUTE_STATUS}${userId}/`, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        if (!res.ok) throw new Error('muteStatus failed');
        const data = await res.json() as { muted: boolean };
        return data.muted;
    }

    /** Mute a user */
    async muteUser(userId: string) {
        const res = await fetch(`${API.MUTE_USER}${userId}/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.jwt}` },
        });
        if (!res.ok) throw new Error('muteUser failed');
    }

    /** Unmute a user */
    async unmuteUser(userId: string) {
        const res = await fetch(`${API.UNMUTE_USER}${userId}/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.jwt}` },
        });
        if (!res.ok) throw new Error('unmuteUser failed');
    }

    /** Pin a message globally */
    async pinMessage(messageId: string) {
        const res = await fetch(`${API.MESSAGES}${messageId}/pin/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.jwt}` },
        });
        if (!res.ok) throw new Error('pinMessage failed');
        return await res.json();
    }

    /** Unpin a message globally */
    async unpinMessage(messageId: string) {
        const res = await fetch(`${API.MESSAGES}${messageId}/unpin/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${this.jwt}` },
        });
        if (!res.ok) throw new Error('unpinMessage failed');
    }

    /** Create a poll option */
    async createPollOption(pollId: string, option: { text: string }) {
        const res = await fetch(`${API.POLLS}${pollId}/options/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {}),
            },
            body: JSON.stringify(option),
        });
        if (!res.ok) throw new Error('createPollOption failed');
        return await res.json();
    }

    /** Recover state after a lost connection */
    async recoverStateOnReconnect() {
        const res = await fetch(API.RECOVER_STATE, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        if (!res.ok) throw new Error('recoverStateOnReconnect failed');
        const data = await res.json() as {
            rooms: Room[];
            notifications: any[];
        };
        const chans = data.rooms.map(
            r => new Channel(r.id, r.uuid, r.name ?? r.uuid, this, r.data || {})
        );
        this.stateStore._set({ channels: chans });
        this.notifications.store._set({ notifications: data.notifications });
        return { channels: chans, notifications: data.notifications };
    }

    /** create / retrieve single channel for <Channel channel={…}> */
    channel(_: 'messaging', roomUuid: string) {
        return new Channel(0, roomUuid, roomUuid, this, {});
    }

    /** Return this client instance */
    getClient() {
        return this;
    }

    /**
     * Return a slice of the provided array.
     * This mirrors TypedArray.subarray from Stream's SDK.
     */
    async subarray<T>(arr: T[], start: number, end?: number): Promise<T[]> {
        const res = await fetch(API.SUBARRAY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {}),
            },
            body: JSON.stringify({ array: arr, start, end }),
        });
        if (!res.ok) throw new Error('subarray failed');
        const data = await res.json() as { result: T[] };
        return data.result;
    }
}