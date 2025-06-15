/* eslint-disable @typescript-eslint/consistent-type-definitions */
// Lightweight adapter that mimics just enough of StreamChatClient
// to satisfy @iliad/stream-ui.  Grow it incrementally.

import mitt from 'mitt';

/* ——————————————————— types ——————————————————— */

type Events =
  | { type: 'message.new'; message: Message }
  | { type: 'typing.start'; user_id: string }
  | { type: 'typing.stop'; user_id: string };

interface Room { uuid: string; name?: string }

export interface Message {
  id: string;
  text: string;
  user_id: string;
  created_at: string;
}

/* ——————————————————— tiny StateStore ——————————————————— */

class MiniStore<T> {
  private _state: T;
  private listeners = new Set<() => void>();
  constructor(initial: T) { this._state = initial }
  getSnapshot = () => this._state;
  getServerSnapshot = () => this._state;
  subscribe = (cb: () => void) => (this.listeners.add(cb), () => this.listeners.delete(cb));
  _set = (patch: Partial<T>) => { this._state = { ...this._state, ...patch }; this.listeners.forEach(l => l()) }
}

/* ——————————————————— top-level chat client ——————————————————— */

export class CustomChatClient {
  readonly user: { id: string };

  clientID = 'local-dev';
  activeChannels: Record<string, any> = {};
  mutedChannels: unknown[] = [];
  listeners: Record<string, any[]> = {};

  readonly stateStore = new MiniStore({ channels: [] as CustomChannel[] });
  private bus = mitt();

  // fields are initialised explicitly in ctor (safer for older compilers)
  threads   !: { registerSubscriptions(): void };
  polls     !: { registerSubscriptions(): void };
  reminders !: { registerSubscriptions(): void; initTimers(): void };

  constructor(private userId: string, private jwt: string) {
    this.user = { id: userId };

    /* ensure properties really exist at runtime */
    this.threads   = { registerSubscriptions() {/* noop */} };
    this.polls     = { registerSubscriptions() {/* noop */} };
    this.reminders = {
      registerSubscriptions() {/* noop */},
      initTimers() {/* noop */},
    };
  }

  on  = this.bus.on  as any;
  off = this.bus.off as any;
  emit = this.bus.emit.bind(this);

  getUserAgent() { return 'custom-chat-client/0.0.1 stream-chat-react-adapter' }

  async queryChannels() {
    const res   = await fetch('/api/rooms/', { headers: { Authorization: `Bearer ${this.jwt}` } });
    const rooms = res.ok ? await res.json() as Room[] : [];
    const chans = rooms.map(r => new CustomChannel(r.uuid, r.name ?? r.uuid, this));
    this.stateStore._set({ channels: chans });
    return chans;
  }

  channel(_: 'messaging', roomUuid: string) { return new CustomChannel(roomUuid, roomUuid, this) }
}

/* ——————————————————— per-room channel ——————————————————— */

class CustomChannel {
  readonly id: string;
  readonly cid: string;
  readonly data: { name: string };

  private socket?: WebSocket;
  private emitter = mitt<Events>();

  private _state = {
    messages: [] as Message[],
    messagePagination: { hasPrev: false, hasNext: false },
    read: {} as Record<string,{ last_read:string; unread_messages:number; user?:{id:string} }>,
  };
  initialized = false;

  constructor(
    private roomUuid: string,
    roomName: string,
    private client: CustomChatClient,
  ) {
    this.id  = roomUuid;
    this.cid = `messaging:${roomUuid}`;
    this.data = { name: roomName };
  }

  /* ---------------- getters Stream-UI expects ------------------- */
  get state() { return this._state }
  getConfig() { return { typing_events:true, read_events:true, reactions:true, uploads:true } }
  countUnread() {
    const entry = this._state.read[this.client.user.id];
    return entry ? entry.unread_messages : 0;
  }

  /* ---------------- public API used by the UI ------------------- */
  async watch() {
    if (this.socket) return;
    this.client.activeChannels[this.cid] = this;

    try {
      const res = await fetch(`/api/rooms/${this.roomUuid}/messages/`, {
        headers: { Authorization: `Bearer ${this.client['jwt']}` },
      });
      if (res.ok) this.bump({ messages: await res.json() });
    } catch {/* empty ok */}

    this.initialized = true;

    this.socket = new WebSocket(`ws://localhost:8000/ws/${this.roomUuid}/?token=${this.client['jwt']}`);
    this.socket.onmessage = (ev) => {
      try {
        const p = JSON.parse(ev.data);
        switch (p.type) {
          case 'message': {
            const msg = p.data as Message;
            this.bump({ messages:[...this._state.messages, msg] });
            this.emitter.emit('message.new', { type:'message.new', message:msg });
            break;
          }
          case 'typing.start':
          case 'typing.stop':
            this.emitter.emit(p.type, { type:p.type, user_id:p.user_id } as any);
            break;
        }
      } catch { console.error('bad WS', ev.data) }
    };
  }

  async markRead() {
    this.bump({
      read:{
        ...this._state.read,
        [this.client.user.id]: { last_read:new Date().toISOString(), unread_messages:0 },
      },
    });
  }

  async sendMessage({ text }: { text:string }) {
    await fetch(`/api/rooms/${this.roomUuid}/messages/`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${this.client['jwt']}` },
      body:JSON.stringify({ text }),
    });
  }

  on  = this.emitter.on  as any;
  off = this.emitter.off as any;

  /* ---------------- internal util ------------------------------- */
  private bump(patch: Partial<typeof this._state>) {
    this._state = { ...this._state, ...patch };
    this.client.stateStore._set({});
  }
}
