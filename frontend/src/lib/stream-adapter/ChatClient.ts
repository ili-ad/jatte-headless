import mitt from 'mitt';
import { MiniStore } from './MiniStore';
import { Channel } from './Channel';
import { API, EVENTS } from './constants';

const randomId = () => Math.random().toString(36).slice(2);
import type { Room, ChatEvents, AppSettings, User } from './types';

/* ------------------------------------------------------------------ */
/* High-level client wrapper that Stream-UI talks to                  */
/* ------------------------------------------------------------------ */

export class ChatClient {
    // `id` will be filled by connectUser; start blank
    readonly user: { id: string | null };
    private emitter = mitt<ChatEvents>();
    /* ---------- fields Stream-UI pokes at ---------- */
    /** Populated by connectUser, nulled by disconnectUser */


    /** Random identifier for this client (regenerated on connectUser) */
    clientID: string;
    /** Unique ID for the current connection (null until connected) */
    connectionId: string | null = null;

    private userAgent = 'custom-chat-client/0.0.1 stream-chat-react-adapter';
    activeChannels: Record<string, any> = {};
    mutedChannels: unknown[] = [];
    listeners: Record<string, any[]> = {};

    /** global stores Stream-UI subscribes to */
    readonly stateStore = new MiniStore({ channels: [] as Channel[] });
    readonly settingsStore = new MiniStore<AppSettings | null>(null);
    private bus = mitt();

    /* feature-module placeholders Stream-UI imports & tears-down */
    threads   !: { registerSubscriptions(): void; unregisterSubscriptions(): void };
    polls     !: { registerSubscriptions(): void; unregisterSubscriptions(): void };
    reminders !: {
        registerSubscriptions(): void; unregisterSubscriptions(): void;
        initTimers(): void; clearTimers(): void;
    };

    /* 🔹 NEW: notifications — only `.store` is required for now */
    notifications!: { store: MiniStore<{ notifications: any[] }> };

    /* ----------------------------------------------------------- */
    constructor(
        private userId: string | null = null,
        private jwt: string | null = null,
    ) {
        this.user = { id: userId };
        this.clientID = randomId();

        /* no-op stubs keep Stream-UI happy */
        this.threads = this.polls = {
            registerSubscriptions() {/* noop */ },
            unregisterSubscriptions() {/* noop */ },
        };
        this.reminders = {
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
    on = this.bus.on as any;
    off = this.bus.off as any;
    emit = this.bus.emit.bind(this);

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
        (this as any).user = { id: user.id };
        this.clientID = `${user.id}--${randomId()}`;
        const res = await fetch(API.SYNC_USER, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },

        });
        if (!res.ok) throw new Error('sync-user failed');
        this.connectionId = crypto.randomUUID();
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
        this.userId = null;
        this.jwt = null;
        this.connectionId = null;
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
            r => new Channel(r.uuid, r.name ?? r.uuid, this),
        );
        this.stateStore._set({ channels: chans });
        return chans;
    }

    /** fetch list of users */
    async queryUsers() {
        const res = await fetch(API.USERS, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        return res.ok ? await res.json() as User[] : [];
    }

    /** Fetch the currently authenticated user */
    async getUser() {
        const res = await fetch(API.USER, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        if (!res.ok) throw new Error('user fetch failed');
        const info = await res.json() as User;
        (this as any).user = { id: String(info.id) };
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

    /** list of currently active channels */
    async getActiveChannels() {
        const res = await fetch(API.ACTIVE_ROOMS, {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        const rooms = res.ok ? (await res.json() as Room[]) : [];
        return rooms.map(r => new Channel(r.uuid, r.name ?? r.uuid, this));
    }

    /** create / retrieve single channel for <Channel channel={…}> */
    channel(_: 'messaging', roomUuid: string) {
        return new Channel(roomUuid, roomUuid, this);
    }

    /** Return this client instance */
    getClient() {
        return this;
    }
}