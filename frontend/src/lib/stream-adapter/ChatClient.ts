import mitt from 'mitt';
import { MiniStore } from './MiniStore';
import { Channel } from './Channel';
import type { Room } from './types';
import type { ChatEvents } from './types';

/* ------------------------------------------------------------------ */
/* High-level client wrapper that Stream-UI talks to                  */
/* ------------------------------------------------------------------ */

export class ChatClient {
    // `id` will be filled by connectUser; start blank
    readonly user: { id: string | null };
    private emitter = mitt<ChatEvents>();
    /* ---------- fields Stream-UI pokes at ---------- */
    /** Populated by connectUser, nulled by disconnectUser */


    clientID = 'local-dev';
    activeChannels: Record<string, any> = {};
    mutedChannels: unknown[] = [];
    listeners: Record<string, any[]> = {};

    /** global store Stream-UI subscribes to */
    readonly stateStore = new MiniStore({ channels: [] as Channel[] });
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
        return 'custom-chat-client/0.0.1 stream-chat-react-adapter';
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
        const res = await fetch('/api/sync-user/', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },

        });
        if (!res.ok) throw new Error('sync-user failed');
        this.emit('connection.changed', { online: true });
    }

    /** Tear-down helper mirroring Stream’s client.disconnectUser */
    disconnectUser() {
        const token = this.jwt;
        if (token) {
            fetch('/api/disconnect-user/', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => { /* ignore network errors */ });
        }

        this.activeChannels = {};
        this.stateStore._set({ channels: [] });
        delete (this as any).user;
        this.userId = null;
        this.jwt = null;
        this.emit('connection.changed', { online: false });
    }

    /* ---------- API that Stream-UI actually calls ---------- */

    /** fetch list of channels for <ChannelList> */
    async queryChannels() {
        const res = await fetch('/api/rooms/', {
            headers: this.jwt ? { Authorization: `Bearer ${this.jwt}` } : {},
        });
        const rooms = res.ok ? (await res.json() as Room[]) : [];

        const chans = rooms.map(
            r => new Channel(r.uuid, r.name ?? r.uuid, this),
        );
        this.stateStore._set({ channels: chans });
        return chans;
    }

    /** create / retrieve single channel for <Channel channel={…}> */
    channel(_: 'messaging', roomUuid: string) {
        return new Channel(roomUuid, roomUuid, this);
    }
}