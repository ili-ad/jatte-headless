// frontend/src/lib/customChatClient.ts
// ────────────────────────────────────────────────────────────────────────────
// A *minimal* wrapper that looks “enough like” Stream Chat’s JS SDK
// for @iliad/stream-ui to render.  Flesh out only when the UI asks for more.
// ────────────────────────────────────────────────────────────────────────────

import mitt from 'mitt';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
interface Room {
  uuid: string;
  name?: string;
}

export interface Message {
  id: string;
  text: string;
  user_id: string;
  created_at: string;
  // TODO: attachments, reactions…
}

type Events =
  | { type: 'message.new'; message: Message }
  | { type: 'typing.start'; user_id: string }
  | { type: 'typing.stop'; user_id: string };

/* ------------------------------------------------------------------ */
/* Super-tiny external-store clone (React 18+ API)                     */
/* ------------------------------------------------------------------ */
class MiniStore<T> {
  private _state: T;
  private listeners = new Set<() => void>();

  constructor(initial: T) {
    this._state = initial;
  }

  /* “useSyncExternalStore” contract */
  getSnapshot = () => this._state;
  getServerSnapshot = () => this._state;
  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  /* helper */
  _set(partial: Partial<T>) {
    this._state = { ...this._state, ...partial };
    this.listeners.forEach((l) => l());
  }
}

/* ------------------------------------------------------------------ */
/* High-level client                                                   */
/* ------------------------------------------------------------------ */
export class CustomChatClient {
  readonly user: { id: string };

  /* fields @iliad/stream-ui pokes at */
  clientID = 'local-dev';
  activeChannels: Record<string, CustomChannel> = {};
  mutedChannels: [] = [];
  listeners: Record<string, any[]> = {};

  private bus = mitt();
  readonly stateStore = new MiniStore({
    channels: [] as CustomChannel[],
  });

  constructor(private userId: string, private jwt: string) {
    this.user = { id: userId };
  }

  /* List visible rooms */
  async queryChannels(): Promise<CustomChannel[]> {
    const res = await fetch('/api/rooms/', {
      headers: { Authorization: `Bearer ${this.jwt}` },
    });
    const rooms: Room[] = await res.json();
    const chans = rooms.map(
      (r) => new CustomChannel(r.uuid, r.name ?? r.uuid, this),
    );
    this.stateStore._set({ channels: chans });
    return chans;
  }

  /* Factory used by <Channel channel={client.channel(...)}> */
  channel(type: 'messaging', uuid: string) {
    return new CustomChannel(uuid, uuid, this);
  }

  /* event emitter façade */
  on = this.bus.on as any;
  off = this.bus.off as any;
  emit = this.bus.emit.bind(this);
}

/* ------------------------------------------------------------------ */
/* Per-room wrapper                                                    */
/* ------------------------------------------------------------------ */
class CustomChannel {
  private socket?: WebSocket;
  private emitter = mitt<Events>();

  readonly id: string;
  readonly cid: string;
  readonly data: { name: string };

  /* state object the UI inspects */
  private _state = {
    messages: [] as Message[],
    messagePagination: { hasPrev: false, hasNext: false },
  };
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

  /** expose state */
  get state() {
    return this._state;
  }

  /** merge-update local state *and* notify global store */
  private bump(partial: Partial<typeof this._state>) {
    this._state = { ...this._state, ...partial };
    this.client.stateStore._set({});
  }

  /** Stream-style channel config */
  getConfig() {
    return {
      typing_events: true,
      read_events: true,
      reactions: true,
      uploads: true,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Real-time connection + first page fetch                          */
  /* ---------------------------------------------------------------- */
  async watch() {
    if (this.socket) return;
    this.client.activeChannels[this.cid] = this;

    /* seed first page so UI isn’t empty */
    try {
      const res = await fetch(`/api/rooms/${this.roomUuid}/messages/`, {
        headers: { Authorization: `Bearer ${this.client['jwt']}` },
      });
      if (res.ok) {
        const firstPage: Message[] = await res.json();
        this.bump({ messages: firstPage });
      }
    } catch (_) {
      /* empty channel → fine for MVP */
    }
    this.initialized = true;

    /* WebSocket for live updates */
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
            this.emitter.emit('message.new', {
              type: 'message.new',
              message: msg,
            });
            break;
          }

          case 'typing.start':
          case 'typing.stop':
            this.emitter.emit(payload.type as any, {
              type: payload.type,
              user_id: payload.user_id,
            } as any);
            break;
        }
      } catch (err) {
        console.error('Bad WS payload', ev.data, err);
      }
    };
  }

  /* ---------------------------------------------------------------- */
  /* API surfaced to the UI                                           */
  /* ---------------------------------------------------------------- */
  on = this.emitter.on as any;
  off = this.emitter.off as any;

  /** called by <MessageInput> */
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

  // TODO: channel.sendImage / sendFile once uploads are wired up
}
