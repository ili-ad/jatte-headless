class LocalChannel {
  private listeners: Map<string, Set<(ev: any) => void>> = new Map();

  constructor(private cid: string, private sock: WebSocket) {}

  async watch() {
    // UI expects a promise; nothing to set up here
    return this;
  }

  async sendMessage(msg: { text: string }) {
    this.sock.send(
      JSON.stringify({ type: 'message.new', cid: this.cid, ...msg })
    );
  }

  on(evt: string, cb: (ev: any) => void) {
    if (!this.listeners.has(evt)) this.listeners.set(evt, new Set());
    this.listeners.get(evt)!.add(cb);
  }

  off(evt: string, cb: (ev: any) => void) {
    this.listeners.get(evt)?.delete(cb);
  }

  emit(evt: string, ev: any) {
    for (const cb of this.listeners.get(evt) ?? []) cb(ev);
  }

  markRead() {
    this.sock.send(
      JSON.stringify({ type: 'mark.read', cid: this.cid })
    );
  }
}

export class LocalChatClient {
  private sock!: WebSocket;
  private channels = new Map<string, LocalChannel>();

  async connectUser(user: { id: string }, jwt: string) {
    this.sock = new WebSocket(
      `ws://${location.hostname}:8000/ws/chat/?token=${jwt}`
    );
    await new Promise((r) => (this.sock.onopen = r as any));
    this.sock.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      const channel = this.channels.get(data.cid);
      channel?.emit(data.type, data);
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
}

export const getLocalClient = () => new LocalChatClient();
