// Lightweight adapter that mimics just enough of StreamChatClient
// to satisfy @iliad/stream-ui.  Expand incrementally.

import mitt from 'mitt';

type Events =
  | { type: 'message.new'; message: Message }
  | { type: 'typing.start'; user_id: string }
  | { type: 'typing.stop'; user_id: string };

interface Room {
  uuid: string;
  name?: string;
}

export interface Message {
  id: string;
  text: string;
  user_id: string;
  created_at: string;
  // attachments, reactions, etc. (later)
}

/* ------------------------------------------------------------------ */
/* Really tiny drop-in for Stream’s StateStore                         */
/* ------------------------------------------------------------------ */
class MiniStore<T> {
  private _state: T;
  private listeners = new Set<() => void>();

  constructor(initial: T) {
    this._state = initial;
  }

  /* external-store contract */
  getSnapshot = () => this._state;
  getServerSnapshot = () => this._state;

  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  /* helper: mutate + notify  */
  _set = (partial: Partial<T>) => {
    this._state = { ...this._state, ...partial };
    this.listeners.forEach((l) => l());
  };
}

/* ------------------------------------------------------------------ */
/* High-level client                                                  */
/* ------------------------------------------------------------------ */
export class CustomChatClient {
  readonly user: { id: string };

  /* fields the UI pokes at */
  clientID = 'local-dev';
  activeChannels: Record<string, any> = {};
  mutedChannels: any[] = [];
  listeners: Record<string, any[]> = {};

  private bus = mitt();

  /* UI looks for client.stateStore */
  readonly stateStore = new MiniStore({
    channels: [] as CustomChannel[],
  });

  constructor(private userId: string, private jwt: string) {
    this.user = { id: userId };
  }

  /* ------------  Stream-ish helpers the UI expects -------------- */

  /** stream-chat-js sends a version string downstream; we just return a stub */
  getUserAgent() {
    return 'custom-chat-client/0.0.1 stream-chat-react-adapter';
  }

  /** basic event hub (not heavily used by the UI yet) */
  on = this.bus.on as any;
  off = this.bus.off as any;
  emit = this.bus.emit.bind(this);

  /* ------------  minimal API surface ---------------------------- */

  async queryChannels(): Promise<CustomChannel[]> {
    const res = await fetch('/api/rooms/', {
      headers: { Authorization: `Bearer ${this.jwt}` },
    });
    const rooms: Room[] = res.ok ? await res.json() : [];
    const chans = rooms.map(
      (r) => new CustomChannel(r.uuid, r.name ?? r.uuid, this),
    );
    this.stateStore._set({ channels: chans });
    return chans;
  }

  /** used by <Channel channel={client.channel(...)}> */
  channel(type: 'messaging', roomUuid: string) {
    return new CustomChannel(roomUuid, roomUuid, this);
  }
}

/* ------------------------------------------------------------------ */
/* Per-room channel wrapper                                           */
/* ------------------------------------------------------------------ */
class CustomChannel {
  private socket?: WebSocket;
  private emitter = mitt<Events>();

  readonly id: string;
  readonly cid: string;
  readonly data: { name: string };

  /** mutable state object Stream-UI reads */
  private _state = {
    messages: [] as Message[],
    messagePagination: { hasPrev: false, hasNext: false },
    /* NEW → satisfy channel.state.read[] access */
    read: {} as Record<
      string,
      { last_read: string; unread_messages: number; user?: { id: string } }
    >,
  };

  /** getter so UI can do `channel.state.messages` */
  get state() {
    return this._state;
  }

  /** UI shows spinner until true */
  initialized = false;

  constructor(
    private roomUuid: string,
    roomName: string,
    private client: CustomChatClient,
  ) {
    this.id = roomUuid;
    this.cid = `messaging:${roomUuid}`;
    this.data = { name: roomName };
  }

  /* ---------- Stream config flags (all enabled) ------------------ */
  getConfig() {
    return {
      typing_events: true,
      read_events: true,
      reactions: true,
      uploads: true,
    };
  }

  /* ---------- watch: REST seed + WS subscribe -------------------- */
  async watch() {
    if (this.socket) return;
    this.client.activeChannels[this.cid] = this;

    /* Seed first page so list isn’t empty */
    try {
      const res = await fetch(`/api/rooms/${this.roomUuid}/messages/`, {
        headers: { Authorization: `Bearer ${this.client['jwt']}` },
      });
      if (res.ok) {
        const firstPage: Message[] = await res.json();
        this.bump({ messages: firstPage });
      }
    } catch {
      /* fine – new room */
    }
    this.initialized = true;

    /* ----------- realtime via WS ------------ */
    this.socket = new WebSocket(
      `ws://localhost:8000/ws/${this.roomUuid}/?token=${this.client['jwt']}`,
    );

    this.socket.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        switch (payload.type) {
          case 'message': {
            const msg = payload.data as Message;
            this.bump({ messages: [...this._state.messages, msg] });
            this.emitter.emit('message.new', { type: 'message.new', message: msg });
            break;
          }
          case 'typing.start':
          case 'typing.stop':
            this.emitter.emit(payload.type, {
              type: payload.type,
              user_id: payload.user_id,
            } as any);
            break;
        }
      } catch {
        console.error('Malformed WS payload', ev.data);
      }
    };
  }

  /* ---------- Stream-style helpers the UI calls ------------------ */

  /** mark channel read – we just zero unread for this user */
  async markRead() {
    this.bump({
      read: {
        ...this._state.read,
        [this.client.user.id]: {
          last_read: new Date().toISOString(),
          unread_messages: 0,
        },
      },
    });
  }

  /* Placeholder for uploads – Stream UI calls channel.sendImage() */
  // async sendImage(file: File) { /* TODO */ }

  async sendMessage({ text }: { text: string }) {
    await fetch(`/api/rooms/${this.roomUuid}/messages/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.client['jwt']}`,
      },
      body: JSON.stringify({ text }),
    });
  }

  on(
    ev: 'message.new' | 'typing.start' | 'typing.stop',
    handler: (e: Events) => void,
  ) {
    // @ts-ignore – mitt types are strict
    this.emitter.on(ev, handler);
  }
  off(
    ev: 'message.new' | 'typing.start' | 'typing.stop',
    handler: (e: Events) => void,
  ) {
    // @ts-ignore
    this.emitter.off(ev, handler);
  }

  /* ---------- internal “setState” utility ------------------------ */
  private bump(partial: Partial<typeof this._state>) {
    this._state = { ...this._state, ...partial };
    this.client.stateStore._set({}); // shallow nudge for React
  }
}
