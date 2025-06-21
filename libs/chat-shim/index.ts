// libs/chat-shim/index.ts
/* -------------------------------- Channel -------------------------------- */

export class LocalChannel {
  private listeners = new Map<string, Set<(ev: any) => void>>();

  constructor(readonly cid: string, private sock: WebSocket) {}

  async watch() {
    return this;                   // SDK returns a promise → UI awaits it
  }

  async sendMessage(msg: { text: string }) {
    this.sock.send(JSON.stringify({ type: 'message.new', cid: this.cid, ...msg }));
  }

  on(evt: string, cb: (ev: any) => void) {
    if (!this.listeners.has(evt)) this.listeners.set(evt, new Set());
    this.listeners.get(evt)!.add(cb);

    // return unsubscribe handle like the real SDK
    return { unsubscribe: () => this.off(evt, cb) };
  }
  off(evt: string, cb: (ev: any) => void) {
    this.listeners.get(evt)?.delete(cb);
  }

  /** Fan-out from ChatClient → Channel-level listeners */
  emit(evt: string, ev: any) {
    for (const cb of this.listeners.get(evt) ?? []) cb(ev);
  }

  markRead() {
    this.sock.send(JSON.stringify({ type: 'mark.read', cid: this.cid }));
  }
}

/* ---------------------------- Chat-client shim --------------------------- */

export class LocalChatClient {
  private sock!: WebSocket;
  private channels = new Map<string, LocalChannel>();
  private userId = 'anonymous';

  /** Equivalent to StreamChat.connectUser */
  async connectUser(user: { id: string }, jwt: string) {
    this.userId = user.id;
    this.sock = new WebSocket(
      `ws://${location.hostname}:8000/ws/chat/?token=${jwt}`
    );

    await new Promise(res => (this.sock.onopen = res as any));

    this.sock.onmessage = ev => {
      const data = JSON.parse(ev.data);
      this.channels.get(data.cid)?.emit(data.type, data);
    };
  }

  channel(type: string, id: string) {
    const cid = `${type}:${id}`;
    if (!this.channels.has(cid)) {
      this.channels.set(cid, new LocalChannel(cid, this.sock));
    }
    return this.channels.get(cid)!;
  }

  disconnectUser() {
    this.sock?.close();
    this.channels.clear();
  }

  /* ---- tiny helpers the real SDK exposes – makes typings happy ---- */
  devToken(uid: string) { return `${uid}.devtoken`; }
  setUserAgent() {/* no-op */}
}

/* --------------------------- compatibility stub -------------------------- */
/** Return the *same* LocalChatClient for any api-key – good enough for local */
let _singleton: StreamChat | undefined;

/** A lightweight class so it is both a value **and** a type. */
export class StreamChat extends LocalChatClient {
  /** Return the same client for any apiKey – good enough for local dev. */
  static getInstance(_apiKey?: string): StreamChat {
    if (!_singleton) _singleton = new StreamChat();
    return _singleton;
  }
}

/* ----------------------------- convenience ------------------------------ */

export const getLocalClient = () => StreamChat.getInstance();


/* ------------------------------------------------------------------------ */
/*  Make  import { Channel } from 'stream‑chat'  resolve successfully       */
export type Channel = LocalChannel;