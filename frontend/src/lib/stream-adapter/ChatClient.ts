import mitt from 'mitt';
import { MiniStore } from './MiniStore';
import { Channel } from './Channel';
import type { Room } from './types';              // ⬅ add this


/* ------------------------------------------------------------------ */
/* High-level client wrapper that Stream-UI talks to                  */
/* ------------------------------------------------------------------ */

export class ChatClient {
    readonly user: { id: string };

    /* ---------- fields Stream-UI pokes at ---------- */
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
    constructor(private userId: string, private jwt: string) {
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
        this.notifications = {
            store: new MiniStore({ notifications: [] }),
        };
    }

    /* ---------- event-bus helpers ---------- */
    on = this.bus.on as any;
    off = this.bus.off as any;
    emit = this.bus.emit.bind(this);

    getUserAgent() {
        return 'custom-chat-client/0.0.1 stream-chat-react-adapter';
    }

    /* ---------- API that Stream-UI actually calls ---------- */

    /** fetch list of channels for <ChannelList> */
    async queryChannels() {
        const res = await fetch('/api/rooms/', {
            headers: { Authorization: `Bearer ${this.jwt}` },
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