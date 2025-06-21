

**De‑Stream front‑end**
UI talks **exclusively** to `ws://localhost:8000/ws/chat/…` via Channels. No traffic to *chat.stream‑io‑api.com*.
“hello world” round‑trips in demo.
Jest + Playwright green in CI.

---

### A5 Implementation Checklist (≈ 1.5 dev days)

1. **Shim package** `libs/chat‑shim/index.ts`

(example below)

class LocalChannel {
  constructor(private cid: string, private sock: WebSocket) {}
  async watch() { /* no‑op, but UI expects a promise */ return this; }
  async sendMessage(msg: {text: string}) {
    this.sock.send(JSON.stringify({type: 'message.new', cid: this.cid, ...msg}));
  }
  on(evt: string, cb: (ev:any)=>void) { /* store in map */ }
  off(evt: string, cb: (ev:any)=>void) { /* remove */ }
  markRead() { /* optional */ }
}

export class LocalChatClient {
  private sock!: WebSocket;
  async connectUser(user:{id:string}, jwt:string) {
    this.sock = new WebSocket(`ws://${location.hostname}:8000/ws/chat/?token=${jwt}`);
    await new Promise(r => (this.sock.onopen = r as any));
    /* listen for frames and fan‑out to channel.on(...) callbacks */
  }
  channel(type:string, id:string) { return new LocalChannel(`${type}:${id}`, this.sock); }
  disconnectUser() { this.sock?.close(); }
}

export const getLocalClient = () => new LocalChatClient();



Keep it ≤ 150 LOC – anything heavier belongs in the Django consumer.

---

2  Type‑safe path alias

    tsconfig.json (root)

{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "stream-chat": ["libs/chat-shim"]      // runtime alias
    },
    "types": ["@types/stream-chat"]          // keep SDK types for TS‑intellisense
  }
}

---

3 Dynamic client resolver

frontend/lib/getStreamClient.ts

import { getLocalClient } from 'stream-chat';  // aliased
import { StreamChat }    from 'stream-chat';   // types only

export const getStreamClient = () =>
  process.env.NEXT_PUBLIC_STREAM_KEY
    ? StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY)
    : getLocalClient();

---

4 Channels consumer skeleton backend/chat/consumers.py

Here's a sketch:

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = await supabase_verify(self.scope["query_string"]["token"])
        self.user = user
        await self.accept()

    async def receive_json(self, event):
        if event["type"] == "message.new":
            room = event["cid"].split(":")[1]
            msg = await Message.objects.create(...)
            await self.channel_layer.group_send(
                room, {"type": "chat.message", "payload": serialize(msg)}
            )

    async def chat_message(self, event):
        await self.send_json(event["payload"])


---

5 WebSocket routing chat/routing.py → add to jatte/asgi.py

---

6 Automated SDK‑usage enumerator
Add a one‑off script scripts/list-stream-imports.ts:

import fg from 'fast-glob';
import fs from 'fs';
for (const file of fg.sync(['frontend/**/*.{ts,tsx}'])) {
  const txt = fs.readFileSync(file,'utf8');
  if (/['"]stream-chat(\/.+)?['"]/.test(txt))
    console.log(file);
}

CI step “A5‑scan” fails if any file prints → forces new shims when the UI
team pulls upstream updates.


---

7 Unit + smoke tests

    Jest with jest-websocket-mock – assert connect, send, echo.

    Playwright headless: open /demo, expect “hello world”.

8 CI wiring

    Job channels – daphne jatte.asgi … & pnpm test && pnpm exec playwright test.

    Add “A5‑scan” step (node scripts/list-stream-imports.ts | tee /dev/tty | (!) grep -q ^$).

9 Docs & housekeeping

    README.md dev‑setup: explain env‑var toggle.

    Keep stream-chat in devDependencies (types only); runtime resolved to shim.

