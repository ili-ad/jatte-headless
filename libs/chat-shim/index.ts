// libs/chat-shim/index.ts
"use client";
import { useSyncExternalStore } from "react";
import { createStore } from "./stateStore";

/* ----- public types the UI already references ---------------------- */
export type LocalMessage = any;
export type ThreadState = { unreadThreadCount: number };
export type StreamChat = {
  threads: { state: ReturnType<typeof createStore<ThreadState>> };
};

export * from "./MessageComposer";
export * from "./noopStore";

/* ----- runtime instance -------------------------------------------- */
export const streamClient: StreamChat = {
  threads: { state: createStore({ unreadThreadCount: 0 }) },
};

/* re-export helpers for future backend code */
export { createStore };

/* ------------------------------------------------------------------ */
/*  Minimal Fixed‑Size FIFO cache Stream‑UI expects                    */
/* ------------------------------------------------------------------ */

export class FixedSizeQueueCache<T = any> {
  private buffer: T[] = [];

  constructor(readonly limit = 200) {}

  /** canonical method */
  push(item: T) {
    this.buffer.push(item);
    if (this.buffer.length > this.limit) this.buffer.shift();
  }

  /** ⇢ legacy alias required by useMessageComposer */
  add(item: T) {
    this.push(item);
  }

  peek(offset = -1): T | undefined {
    if (this.buffer.length === 0) return undefined;
    const idx = offset >= 0 ? offset : this.buffer.length + offset;
    return this.buffer[idx];
  }

  get size() {
    return this.buffer.length;
  }

  getValues(): T[] {
    return this.buffer;
  }

  clear() {
    this.buffer = [];
  }
}

/* -------------------------------- Channel -------------------------------- */

export class ChannelState {
  messages: any[] = [];
  messagePagination = { hasPrev: false, hasNext: false };
  read: Record<string, any> = {};
  watchers: Record<string, any> = {};
  members: Record<string, any> = {};
  pinnedMessages: any[] = [];
  typing: Record<string, any> = {};
  threads: Record<string, any[]> = {} as any;

  constructor(
    private notify: (patch: Partial<ChannelState>) => void = () => {},
  ) {}

  addMessageSorted(msg: any) {
    this.messages.push(msg);
    this.notify({ messages: this.messages });
  }
  filterErrorMessages() {
    this.messages = this.messages.filter((m) => m.type !== "error");
    this.notify({ messages: this.messages });
  }
  removeMessage(msg: any) {
    this.messages = this.messages.filter((m) => m.id !== msg.id);
    this.notify({ messages: this.messages });
  }
  countUnread(userId: string) {
    const me = this.read[userId];
    return me ? me.unread_messages : 0;
  }
}

export class LocalChannel {
  readonly type: string;
  readonly id: string;
  private listeners = new Map<string, Set<(ev: any) => void>>();
  /** Minimal state object mimicking Stream's ChannelState */
  readonly state: ChannelState;

  /** Minimal message composer so <MessageInput> works */
  readonly messageComposer: MessageComposer;

  /** Store wrapper used by Stream UI hooks */
  readonly stateStore: StateStore<ChannelState>;
  private getUserId: () => string;

  constructor(
    readonly cid: string,
    private sock: WebSocket,
    getUid: () => string,
  ) {
    const [type, id] = cid.split(":");
    this.type = type;
    this.id = id ?? "";
    this.getUserId = getUid;
    this.state = new ChannelState((patch) => this.stateStore.dispatch(patch));
    this.stateStore = new StateStore(this.state);
    this.messageComposer = new MessageComposer();
    this.messageComposer.submit = () => {
      const text = this.messageComposer.state.text.trim();
      if (!text) return;
      this.sendMessage({ text });
      this.messageComposer.reset();
    };
  }

  async watch() {
    return this; // SDK returns a promise → UI awaits it
  }

  async sendMessage(msg: { text: string }) {
    this.sock.send(
      JSON.stringify({ type: "message.new", cid: this.cid, ...msg }),
    );
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
    this.sock.send(JSON.stringify({ type: "mark.read", cid: this.cid }));
  }

  /** Return basic configuration flags expected by Stream UI */
  getConfig() {
    return { typing_events: true, read_events: true };
  }

  /** Return unread count for the current user */
  countUnread() {
    return this.state.countUnread(this.getUserId());
  }
}

/* ---------------------------- Chat-client shim --------------------------- */

type Handler = (e: any) => void;

export class LocalChatClient {
  /* ------------------------------------------------------------------- */
  /*  ░░ 1.   original fields & helpers                                  */
  /* ------------------------------------------------------------------- */

  private sockets = new Map<string, WebSocket>();
  private channels = new Map<string, LocalChannel>();
  private userId = "anonymous";
  private userAgent = "local-chat-client/0.0.1 stream-chat-react-adapter";
  private jwt = "";
  /** properties stream-chat-react pokes at */
  clientID = "";
  activeChannels: Record<string, LocalChannel> = {};
  listeners: Record<string, Handler[]> = {};
  mutedChannels: any[] = [];

  /** Minimal threads helper expected by Stream UI */
  threads = {
    registerSubscriptions() {
      /* noop */
    },
    unregisterSubscriptions() {
      /* noop */
    },
  };

  /** Minimal polls helper expected by Stream UI */
  polls = {
    store: new StateStore<{ polls: any[] }>({ polls: [] }),
    registerSubscriptions() {
      /* noop */
    },
    unregisterSubscriptions() {
      /* noop */
    },
  };

  /** Minimal reminders helper expected by Stream UI */
  reminders = new ReminderManager();

  /** Minimal notifications helper expected by Stream UI */
  notifications = {
    store: new StateStore<{ notifications: any[] }>({ notifications: [] }),
    registerSubscriptions() {
      /* noop */
    },
    unregisterSubscriptions() {
      /* noop */
    },
  };

  getUserAgent() {
    return this.userAgent;
  }
  setUserAgent(ua: string) {
    this.userAgent = ua;
  }

  /* ------------------------------------------------------------------- */
  /*  ░░ 2.   tiny event-bus so  stream-chat-react  can  .on/.off()      */
  /* ------------------------------------------------------------------- */

  private bus = new Map<string, Set<Handler>>();
  on = (evt: string, cb: Handler) => {
    if (!this.bus.has(evt)) this.bus.set(evt, new Set());
    this.bus.get(evt)!.add(cb);
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(cb);
    return { unsubscribe: () => this.off(evt, cb) };
  };
  off = (evt: string, cb: Handler) => {
    this.bus.get(evt)?.delete(cb);
    const arr = this.listeners[evt];
    if (arr) {
      this.listeners[evt] = arr.filter((fn) => fn !== cb);
      if (this.listeners[evt].length === 0) delete this.listeners[evt];
    }
  };
  private emit = (evt: string, data: any) =>
    this.bus.get(evt)?.forEach((cb) => cb(data));

  /* ------------------------------------------------------------------- */
  /*  ░░ 3.   ultra-thin “state” & “user” objects the hook assumes exist */
  /* ------------------------------------------------------------------- */

  /** Stream’s SDK keeps run-time data in `client.state`. */
  state = { channels: new Map<string, any>() };
  /** Filled once connectUser() succeeds so Chat context has `client.user` */
  user: { id: string } | undefined;
  /** Connection indicator the SDK's hooks peek at */
  wsConnection = { online: false };
  getState = () => this.state; // some helper hooks call this

  /* ------------------------------------------------------------------- */
  /*  ░░ 4.   websocket lifecycle                                        */
  /* ------------------------------------------------------------------- */

  async connectUser(user: { id: string }, jwt: string) {
    this.userId = user.id;
    this.jwt = jwt;
    this.clientID = `${user.id}--${Math.random().toString(36).slice(2)}`;
    this.activeChannels = {};
    this.listeners = {};
    this.mutedChannels = [];

    /* notify backend we are online */
    await fetch('/api/sync-user/', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Authorization: `Bearer ${jwt}` },
    });

    this.user = undefined;
    this.wsConnection.online = false;

    /* 4-a ► connections will be opened per-channel */

    /* 4-c ► expose minimal user object & broadcast “online” */
    this.user = { id: this.userId };
    this.wsConnection.online = true;
    this.emit("connection.changed", { online: true });
  }

  async queryUsers() {
    const resp = await fetch('/api/users/', {
      method: 'GET',
      credentials: 'same-origin',
    });
    const data = await resp.json();
    return { users: data };
  }

  channel(type: string, id?: string) {
    const cid = `${type}:${id ?? "local"}`;
    if (!this.channels.has(cid)) {
      const url = `ws://${location.host}/ws/${cid}/?token=${this.jwt}`;
      const sock = new WebSocket(url);
      sock.onmessage = (ev) => {
        const data = JSON.parse(ev.data);
        this.channels.get(data.cid)?.emit(data.type, data);
      };
      this.sockets.set(cid, sock);
      const chan = new LocalChannel(cid, sock, () => this.userId);
      this.channels.set(cid, chan);
      this.activeChannels[cid] = chan;
      (this.state.channels as Map<string, any>).set(cid, chan);
    }
    return this.channels.get(cid)!;
  }

  disconnectUser() {
    this.sockets.forEach((s) => s.close());
    this.sockets.clear();
    this.channels.clear();
    this.activeChannels = {};
    this.listeners = {};
    this.mutedChannels = [];
    this.state.channels.clear();
    this.user = undefined;
    this.wsConnection.online = false;
    this.userId = "anonymous";
    this.clientID = "";
    this.emit("connection.changed", { online: false });
  }

  /** Delete a message by id via the backend */
  async deleteMessage(id: string): Promise<any> {
    const resp = await fetch(`/api/messages/${id}/`, { method: "DELETE" });
    return resp.json();
  }

  /** Retrieve a single message by id via the backend */
  async getMessage(id: string): Promise<any> {
    const resp = await fetch(`/api/messages/${id}/`);
    return resp.json();
  }
}

/* ------------------------- Link preview manager ------------------------- */

export interface LinkPreview {
  url: string;
  title: string;
  status?: LinkPreviewStatus;
  [k: string]: any;
}

export enum LinkPreviewStatus {
  dismissed = "dismissed",
  failed = "failed",
  loaded = "loaded",
  loading = "loading",
  pending = "pending",
}

/* ------------------------- Link preview manager ------------------------- */

export class LinkPreviewsManager {
  private cache = new Map<string, LinkPreview>();

  /** private store the hooks subscribe to */
  private readonly store = new StateStore<LinkPreviewsManagerState>({
    previews: this.cache,
  });

  constructor(private limit = 100) {
    /* legacy alias expected by old Stream-Chat-React hooks */
    (this.store as any).getLatestValue = this.store.getState.bind(this);
  }

  /* ── compatibility ──────────────────────────────────────────────────── */
  /** Stream-Chat-React reads `linkPreviews.state.getLatestValue()` and
      `.state.subscribe(cb)`, so expose the store via a getter.            */
  get state() {
    return this.store;
  }

  /* ── business logic ─────────────────────────────────────────────────── */

  /** Fetch (or return cached) preview data, then broadcast it */
  async fetch(url: string): Promise<LinkPreview> {
    const cached = this.cache.get(url);
    if (cached) {
      /* refresh LRU order */
      this.cache.delete(url);
      this.cache.set(url, cached);
      return cached;
    }

    const resp = await fetch(
      `/api/link-preview?url=${encodeURIComponent(url)}`,
    );
    const data: LinkPreview = {
      ...(await resp.json()),
      status: LinkPreviewStatus.loaded,
    };

    this.cache.set(url, data);
    if (this.cache.size > this.limit) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    /* notify any subscribers */
    this.store.dispatch({ previews: this.cache });
    return data;
  }

  /** Mark a preview as dismissed and broadcast the change */
  dismissPreview(url: string) {
    const preview = this.cache.get(url);
    if (preview) {
      preview.status = LinkPreviewStatus.dismissed;
      this.cache.set(url, preview);
      this.store.dispatch({ previews: this.cache });
    }
  }

  /* ── static helpers used by Stream-Chat-React ───────────────────────── */

  static previewIsLoading(p: LinkPreview) {
    return p.status === LinkPreviewStatus.loading;
  }
  static previewIsLoaded(p: LinkPreview) {
    return p.status === LinkPreviewStatus.loaded;
  }
  static previewIsDismissed(p: LinkPreview) {
    return p.status === LinkPreviewStatus.dismissed;
  }
  static previewIsFailed(p: LinkPreview) {
    return p.status === LinkPreviewStatus.failed;
  }
  static previewIsPending(p: LinkPreview) {
    return p.status === LinkPreviewStatus.pending || !p.status;
  }

  static getPreviewData(p: LinkPreview) {
    const { status, ...rest } = p;
    return rest;
  }
}

/* --------------------------- compatibility stub -------------------------- */
/** Return the *same* LocalChatClient for any api-key – good enough for local */
// let _singleton: StreamChat | undefined;

// /** A lightweight class so it is both a value **and** a type. */
// export class StreamChat extends LocalChatClient {
//   /** Return the same client for any apiKey – good enough for local dev. */
//   static getInstance(_apiKey?: string): StreamChat {
//     if (!_singleton) _singleton = new StreamChat();
//     return _singleton;
//   }
// }

// /* ------------------------- Link preview manager ------------------------- */

// export interface LinkPreview {
//   url: string;
//   title: string;
//   status?: LinkPreviewStatus;
//   [k: string]: any;
// }

// export enum LinkPreviewStatus {
//   dismissed = 'dismissed',
//   failed = 'failed',
//   loaded = 'loaded',
//   loading = 'loading',
//   pending = 'pending',
// }

// export class LinkPreviewsManager {
//   private cache = new Map<string, LinkPreview>();

//   constructor(private limit = 100) {}

//   async fetch(url: string): Promise<LinkPreview> {
//     const cached = this.cache.get(url);
//     if (cached) {
//       this.cache.delete(url);
//       this.cache.set(url, cached);
//       return cached;
//     }
//     const resp = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
//     const data: LinkPreview = { ...(await resp.json()), status: LinkPreviewStatus.loaded };
//     this.cache.set(url, data);
//     if (this.cache.size > this.limit) {
//       const firstKey = this.cache.keys().next().value;
//       if (firstKey) this.cache.delete(firstKey);
//     }
//     return data;
//   }

//   dismissPreview(url: string) {
//     const preview = this.cache.get(url);
//     if (preview) {
//       preview.status = LinkPreviewStatus.dismissed;
//       this.cache.set(url, preview);
//     }
//   }

//   static previewIsLoading(p: LinkPreview) {
//     return p.status === LinkPreviewStatus.loading;
//   }
//   static previewIsLoaded(p: LinkPreview) {
//     return p.status === LinkPreviewStatus.loaded;
//   }
//   static previewIsDismissed(p: LinkPreview) {
//     return p.status === LinkPreviewStatus.dismissed;
//   }
//   static previewIsFailed(p: LinkPreview) {
//     return p.status === LinkPreviewStatus.failed;
//   }
//   static previewIsPending(p: LinkPreview) {
//     return p.status === LinkPreviewStatus.pending || !p.status;
//   }
//   static getPreviewData(p: LinkPreview) {
//     const { status, ...rest } = p;
//     return rest;
//   }
// }

// export interface LinkPreviewsManagerState {
//   previews: Map<string, LinkPreview>;
// }

// /* --------------------------- compatibility stub -------------------------- */
// /** Return the *same* LocalChatClient for any api-key – good enough for local */
// let _singleton: StreamChat | undefined;

// /** A lightweight class so it is both a value **and** a type. */
// export class StreamChat extends LocalChatClient {
//   /** Return the same client for any apiKey – good enough for local dev. */
//   static getInstance(_apiKey?: string): StreamChat {
//     if (!_singleton) _singleton = new StreamChat();
//     return _singleton;
//   }
// }

/* ----------------------------- convenience ------------------------------ */

export const getLocalClient = () => StreamChat.getInstance();

export function formatMessage(text: string): string {
  const linkified = text.replace(
    /https?:\/+[^\s]+/g,
    (url) => `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`,
  );
  const emoji = require("emoji-dictionary");
  return linkified.replace(/:([a-z0-9_+-]+):/gi, (m, name) => {
    const ch = emoji.getUnicode(name);
    return ch || m;
  });
}

/** Convert a LocalMessage (client-side representation) into the payload sent
 *  when creating a new message. Maps `id` → `tmp_id` and attaches
 *  `user: { id }`. Any remaining fields are copied over unchanged.
 */
export function localMessageToNewMessagePayload(local: any): any {
  const { id, user_id, ...rest } = local ?? {};
  return { ...rest, tmp_id: id, user: { id: user_id } };
}

/* --------------------------- value helpers ---------------------------- */

/** Return true when attachment originated from link preview scraping */
export function isScrapedContent(a: any): boolean {
  return !!a?.og_scrape_url;
}

function hasExt(name: string | undefined, exts: string[]): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return exts.some((e) => n.endsWith(e));
}

/** Fallback detection for generic file attachments */
export function isFileAttachment(a: any): boolean {
  const mime = (a?.mime_type ?? "").toLowerCase();
  const name = (a?.name ?? a?.fallback ?? "").toLowerCase();

  const isImage =
    mime.startsWith("image/") ||
    hasExt(name, [".jpg", ".jpeg", ".png", ".gif"]);
  const isVideo = mime.startsWith("video/") || hasExt(name, [".mp4", ".webm"]);
  const isAudio = mime.startsWith("audio/") || hasExt(name, [".mp3", ".wav"]);

  return !(isImage || isVideo || isAudio || isScrapedContent(a));
}

/* --------------------------- attachment helpers ------------------------- */
export const isVoiceRecordingAttachment = (a: any): boolean =>
  !!a &&
  typeof a.mime_type === "string" &&
  a.mime_type.startsWith("audio/") &&
  Array.isArray((a as any).waveform);

/* ------------------------------------------------------------------------ */
/*  Make  import { Channel } from 'stream‑chat'  resolve successfully       */
export type Channel = LocalChannel;

export type UserResponse = any;

/* ----------------------------- attachments ------------------------------ */

export interface AttachmentManagerState {
  attachments: any[];
}

const IMG_RX = /\.(?:jpe?g|png|gif)$/i;
const VID_RX = /\.(?:mp4|webm)$/i;
const AUD_RX = /\.(?:mp3|wav)$/i;

const getMime = (a: any) => (a?.mime_type || a?.file?.type || "").toLowerCase();

const getName = (a: any) => (a?.file?.name || "").toLowerCase();

export const isLocalAttachment = (a: any): boolean => {
  if (!a) return false;
  const hasFile = typeof File !== "undefined" && a.file instanceof File;
  return hasFile || a.state === "uploading";
};

export const isLocalUploadAttachment = (a: any): boolean =>
  isLocalAttachment(a) && a.state === "uploading";

export const isLocalImageAttachment = (a: any): boolean =>
  isLocalAttachment(a) &&
  (getMime(a).startsWith("image/") || IMG_RX.test(getName(a)));

export const isLocalVideoAttachment = (a: any): boolean =>
  isLocalAttachment(a) &&
  (getMime(a).startsWith("video/") || VID_RX.test(getName(a)));

export const isLocalAudioAttachment = (a: any): boolean =>
  isLocalAttachment(a) &&
  (getMime(a).startsWith("audio/") || AUD_RX.test(getName(a)));

export const isLocalVoiceRecordingAttachment = (a: any): boolean =>
  isLocalAudioAttachment(a) && Array.isArray(a.waveform);

export const isLocalFileAttachment = (a: any): boolean =>
  isLocalAttachment(a) &&
  !(
    isLocalImageAttachment(a) ||
    isLocalVideoAttachment(a) ||
    isLocalAudioAttachment(a)
  );

/* ------------------------------ helpers -------------------------------- */

const _nameFrom = (a: any): string =>
  (a?.name || a?.title || a?.filename || a?.asset_url || "").toLowerCase();

const _hasExt = (a: any, exts: string[]) =>
  exts.some((ext) => _nameFrom(a).endsWith(ext));

export const isImageAttachment = (a: any): boolean => {
  const mime = (a?.mime_type || "").toLowerCase();
  if (/^image\/(jpeg|jpg|png|gif)/.test(mime)) return true;
  return _hasExt(a, [".jpeg", ".jpg", ".png", ".gif"]);
};

export const isVideoAttachment = (a: any): boolean => {
  const mime = (a?.mime_type || "").toLowerCase();
  if (/^video\/(mp4|webm)/.test(mime)) return true;
  return _hasExt(a, [".mp4", ".webm"]);
};

export const isAudioAttachment = (a: any): boolean => {
  const mime = (a?.mime_type || "").toLowerCase();
  if (/^audio\/(mp3|mpeg|wav)/.test(mime)) return true;
  return _hasExt(a, [".mp3", ".wav"]);
};

/* ------------------------- fixed size queue cache ----------------------- */

// export class FixedSizeQueueCache<K, T> {
//   private keys: K[] = [];
//   private map = new Map<K, T>();
//   private dispose?: (key: K, value: T) => void;

//   constructor(private size: number, opts?: { dispose: (key: K, value: T) => void }) {
//     if (!size) throw new Error('Size must be greater than 0');
//     this.dispose = opts?.dispose;
//   }

//   add(key: K, value: T) {
//     const idx = this.keys.indexOf(key);
//     if (idx > -1) {
//       this.keys.splice(idx, 1);
//     } else if (this.keys.length >= this.size) {
//       const itemKey = this.keys.shift();
//       if (itemKey !== undefined) {
//         const item = this.map.get(itemKey);
//         if (item !== undefined) this.dispose?.(itemKey, item);
//         this.map.delete(itemKey);
//       }
//     }
//     this.keys.push(key);
//     this.map.set(key, value);
//   }

//   peek(key: K): T | undefined {
//     return this.map.get(key);
//   }

//   get(key: K): T | undefined {
//     const val = this.map.get(key);
//     if (val !== undefined && this.keys.indexOf(key) !== this.keys.length - 1) {
//       const idx = this.keys.indexOf(key);
//       if (idx > -1) {
//         this.keys.splice(idx, 1);
//         this.keys.push(key);
//       }
//     }
//     return val;
//   }
// }

/* --------------------------- message composer -------------------------- */

export interface MessageComposerState {
  text: string;
  attachments: any[];
}

export interface MessageComposerConfig {
  [k: string]: any;
}

export class MessageComposer {
  contextType: "message" = "message";
  state: MessageComposerState = { text: "", attachments: [] };
  /** configuration for the composer, e.g. accepted file types */
  configState: StateStore<MessageComposerConfig>;
  attachmentManager: {
    state: StateStore<AttachmentManagerState>;
    availableUploadSlots: number;
    addFiles(files: File[]): Promise<void>;
    removeAttachment(id: string): void;
    replaceAttachment(oldAtt: any, newAtt: any): void;
  };
  linkPreviewsManager: {
    state: StateStore<LinkPreviewsManagerState>;
    add(url: string): Promise<LinkPreview>;
    remove(url: string): void;
    clear(): void;
  };

  constructor(_config: MessageComposerConfig = {}) {
    this.configState = new StateStore<MessageComposerConfig>({
      attachments: {
        acceptedFiles: [],
        fileUploadFilter: () => true,
        maxNumberOfFilesPerMessage: 10,
      },
      drafts: { enabled: false },
      linkPreviews: {
        debounceURLEnrichmentMs: 1500,
        enabled: false,
        findURLFn: (_t: string) => [],
      },
      text: { enabled: true, publishTypingEvents: true },
      ..._config,
    });
    const attState = new StateStore<AttachmentManagerState>({
      attachments: [],
    });
    this.attachmentManager = {
      state: attState,
      availableUploadSlots: 10,
      async addFiles(files: File[]) {
        const list = [...attState.getLatestValue().attachments];
        for (const f of files)
          list.push({ id: `local-${Date.now()}`, file: f });
        attState.dispatch({ attachments: list });
      },
      removeAttachment(id: string) {
        const list = attState
          .getLatestValue()
          .attachments.filter((a) => a.id !== id);
        attState.dispatch({ attachments: list });
      },
      replaceAttachment(oldAtt: any, newAtt: any) {
        const list = attState
          .getLatestValue()
          .attachments.map((a) => (a === oldAtt ? newAtt : a));
        attState.dispatch({ attachments: list });
      },
    };

    const lpState = new StateStore<LinkPreviewsManagerState>({
      previews: new Map(),
    });
    const manager = new LinkPreviewsManager();
    this.linkPreviewsManager = {
      state: lpState,
      async add(url: string) {
        const preview = await manager.fetch(url);
        const map = new Map(lpState.getLatestValue().previews);
        map.set(url, preview);
        lpState.dispatch({ previews: map });
        return preview;
      },
      remove(url: string) {
        const map = new Map(lpState.getLatestValue().previews);
        map.delete(url);
        manager.dismissPreview(url);
        lpState.dispatch({ previews: map });
      },
      clear() {
        lpState.dispatch({ previews: new Map() });
      },
    };
  }

  reset() {
    this.state = { text: "", attachments: [] };
  }

  setText(text: string) {
    this.state.text = text;
  }

  addAttachment(att: any) {
    this.state.attachments.push(att);
  }

  /** simple helper used by LocalChannel */
  submit(send?: (text: string) => void) {
    const text = this.state.text.trim();
    if (!text || !send) return;
    send(text);
    this.reset();
  }
}

export enum VotingVisibility {
  anonymous = "anonymous",
  public = "public",
}

export interface Poll {
  id: string;
  question: string;
  user_id?: string;
  created_at?: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  user_id?: string;
  created_at?: string;
}

export interface PollState {
  poll: Poll;
  options: PollOption[];
}

export type PollVote = {
  id: string;
  poll_id: string;
  created_at: string;
  updated_at: string;
  option_id?: string;
  user?: UserResponse;
  user_id?: string;
};

export type PollAnswer = Omit<PollVote, "option_id"> & {
  answer_text: string;
  is_answer: boolean;
};

export const isVoteAnswer = (vote: PollVote | PollAnswer): vote is PollAnswer =>
  !!(vote as PollAnswer).answer_text;

/* ------------------------------ reminders ------------------------------ */

export interface Reminder {
  id: string;
  text: string;
  remind_at: string;
}

export interface ReminderState {
  reminder: Reminder;
  timer?: ReturnType<typeof setTimeout>;
}

export interface ReminderManagerState {
  reminders: ReminderState[];
}

/** Minimal manager that schedules timeouts for reminders */
export class ReminderManager {
  readonly store = new StateStore<ReminderManagerState>({ reminders: [] });
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  registerSubscriptions() {
    /* noop */
  }
  unregisterSubscriptions() {
    /* noop */
  }

  /** schedule timers for all reminders in the store */
  initTimers() {
    this.clearTimers();
    const { reminders } = this.store.getLatestValue();
    for (const r of reminders) {
      const delay = new Date(r.reminder.remind_at).getTime() - Date.now();
      const t = setTimeout(
        () => {
          this.timers.delete(r.reminder.id);
        },
        Math.max(0, delay),
      );
      r.timer = t;
      this.timers.set(r.reminder.id, t);
    }
  }

  /** Create a reminder via the backend and store it */
  async createReminder(text: string, remind_at: string): Promise<Reminder> {
    const resp = await fetch("/api/reminders/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, remind_at }),
    });
    const data = await resp.json();
    const reminder: Reminder = data.reminder;
    const list = this.store.getLatestValue().reminders.slice();
    list.push({ reminder });
    this.store.dispatch({ reminders: list });
    this.initTimers();
    return reminder;
  }

  /** clear all scheduled reminders */
  clearTimers() {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
    const { reminders } = this.store.getLatestValue();
    for (const r of reminders) r.timer = undefined;
  }
}

export function getTriggerCharWithToken(
  text: string,
  triggers = ["@", "/"],
): string {
  const words = text.split(/\s+/);
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i];
    if (w && triggers.includes(w[0])) return w;
  }
  return "";
}

export function insertItemWithTrigger<T extends string>(
  text: T,
  item: string,
  triggers = ["@", "/"],
): T {
  const token = getTriggerCharWithToken(String(text), triggers);
  if (!token) return text;
  return String(text).replace(token, token[0] + item + " ") as any as T;
}

export function replaceWordWithEntity<T extends string>(
  text: T,
  word: string,
  entity: string,
): T {
  return String(text).replace(word, entity) as any as T;
}

/* ------------------------------- alerts -------------------------------- */

export type ToastNotification = {
  type: "toast";
  text: string;
};

export type BannerNotification = {
  type: "banner";
  text: string;
};

export type Notification = ToastNotification | BannerNotification;

export interface NotificationManagerState {
  notifications: Notification[];
}

/* ────────────────────────────────────────────────  SEARCH HELPERS  ── */
/** Dumb cache used by CursorPaginator etc. */
// export class StateStore<T = any> {
//   #store = new Map<string, T>();
//   get(key: string)          { return this.#store.get(key); }
//   set(key: string, value:T) { this.#store.set(key, value); }
//   clear()                   { this.#store.clear(); }
// }

// export class ChannelSearchSource   { search   = async () => ([]); }
// export class MessageSearchSource   { search   = async () => ([]); }
// export class UserSearchSource      { search   = async () => ([]); }

// export class SearchController {
//   constructor(
//     public channelSrc  = new ChannelSearchSource(),
//     public messageSrc  = new MessageSearchSource(),
//     public userSrc     = new UserSearchSource(),
//   ) {}
//   /** parallel no-op search */
//   async search() { return { channels: [], messages: [], users: [] }; }
// }

/* ------------------------------------------------------------------ */
/*  ⚠️  RUNTIME shims required by stream-chat-react                    */
/* ------------------------------------------------------------------ */

export class StateStore<T = any> {
  private state: T;
  private listeners = new Set<() => void>();

  constructor(init: T) {
    this.state = init;
  }

  getState() {
    return this.state;
  }

  /** subscribe to state changes */
  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** subscribe to a slice of the state */
  subscribeWithSelector<O>(selector: (v: T) => O, cb: () => void) {
    let prev = selector(this.state);
    return this.subscribe(() => {
      const next = selector(this.state);
      if (next !== prev) {
        prev = next;
        cb();
      }
    });
  }

  /** latest state snapshot for hooks */
  getLatestValue() {
    return this.state;
  }

  /** dispatch a partial state update */
  dispatch(patch: Partial<T>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  /** stream-ui alias */
  partialNext(patch: Partial<T>) {
    this.dispatch(patch);
  }

  /** rxjs-compat alias */
  next = this.dispatch.bind(this);
}

/** React hook that subscribes to a StateStore and returns its latest value */
export function useStateStore<T, O = T>(
  store:
    | StateStore<T>
    | {
        subscribe?: (cb: () => void) => () => void;
        getLatestValue?: () => T;
        getSnapshot?: () => T;
      }
    | undefined,
  selector: (v: T) => O = (v) => v as unknown as O,
): O | undefined {
  if (!store || typeof (store as any).subscribe !== "function")
    return undefined;
  const getter =
    (store as any).getLatestValue ??
    (store as any).getSnapshot ??
    (() => undefined);
  return useSyncExternalStore(
    (store as any).subscribe.bind(store),
    () => selector(getter()),
    () => selector(getter()),
  );
}

/* ------------------------------------------------------------------ */
/*  Search helpers                                                     */
/* ------------------------------------------------------------------ */

export interface SearchSourceState {
  isLoading: boolean;
}

export enum SearchSourceType {
  channel = "channel",
  message = "message",
  user = "user",
}

export interface SearchSource {
  type: SearchSourceType;
  state: StateStore<SearchSourceState>;
  query(text: string): Promise<any[]>;
}

export abstract class BaseSearchSource implements SearchSource {
  readonly state = new StateStore<SearchSourceState>({ isLoading: false });
  abstract type: SearchSourceType;
  constructor(protected client: any) {}
  async query(_text: string): Promise<any[]> {
    return [];
  }
}

export class ChannelSearchSource extends BaseSearchSource {
  type = SearchSourceType.channel;
}
export class MessageSearchSource extends BaseSearchSource {
  type = SearchSourceType.message;
}
export class UserSearchSource extends BaseSearchSource {
  type = SearchSourceType.user;
}

export interface SearchControllerState {
  focusedMessage?: any;
  sources: SearchSource[];
}

/** Controller that manages multiple search sources */
export class SearchController {
  readonly state: StateStore<SearchControllerState>;
  readonly _internalState: StateStore<SearchControllerState>;

  constructor(opts: { sources?: SearchSource[] } = {}) {
    const sources = opts.sources ?? [];
    this.state = new StateStore<SearchControllerState>({
      focusedMessage: undefined,
      sources,
    });
    this._internalState = this.state;
  }

  async query(query: string) {
    const { sources } = this.state.getLatestValue();
    const results = await Promise.all(sources.map((s) => s.query(query)));
    return results.flat();
  }
}

// /* ------------------------------------------------------------------ */
// /*  ►  DEFERRED polyfill so we break the circular‑import              */
// /*      (runs on next micro‑task, when this module is fully initial.) */
// /* ------------------------------------------------------------------ */

// /* =================================================================== */
// /*  🔧  Stream‑Chat‑React 13.x compatibility shims                     */
// /*       (executed after this module is fully initialised)             */
// /* =================================================================== */
// Promise.resolve().then(() => {
//   // dynamic require avoids ESM import cycles
//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   const scr = require('stream-chat-react') as any;
//   if (!scr) return;

//   /* ---------------------------------------------------- *
//    * 1)  Patch StateStore prototype (one place, covers all)
//    * ---------------------------------------------------- */
//   const storeProto = scr.StateStore?.prototype;
//   if (storeProto) {
//     if (typeof storeProto.getLatestValue !== 'function') {
//       storeProto.getLatestValue =
//         storeProto.getState ??
//         storeProto.getSnapshot ??
//         function () { return this.state; };
//     }
//     if (typeof storeProto.subscribe !== 'function') {
//       // most components don’t unsubscribe; a no‑op is enough
//       storeProto.subscribe = () => () => {};
//     }
//   }

//   /* ---------------------------------------------------- *
//    * 2)  Patch LinkPreviewsManager (used by MessageInput)  *
//    * ---------------------------------------------------- */
//   const lpProto = scr.LinkPreviewsManager?.prototype;
//   if (lpProto) {
//     if (typeof lpProto.getLatestValue !== 'function') {
//       lpProto.getLatestValue = function () {
//         return { previews: this.cache ?? new Map() };
//       };
//     }
//     if (typeof lpProto.subscribe !== 'function') {
//       lpProto.subscribe = (cb: () => void) => { cb(); return () => {}; };
//     }
//     if (!Object.getOwnPropertyDescriptor(lpProto, 'state')) {
//       Object.defineProperty(lpProto, 'state', {
//         get() { return this; },                // stable reference
//       });
//     }
//   }

//   // eslint-disable-next-line no-console
//   console.info('[chat‑shim] Stream‑Chat‑React polyfills installed');
// });

// /* ------------------------------------------------------------------ */
// /*  Deferred patch — runs after this module & SCR have loaded          */
// /* ------------------------------------------------------------------ */

// queueMicrotask(async () => {
//   // dynamic import sidesteps the circular-import TDZ
//   const scr: any = await import('stream-chat-react');

//   /* ---------- ensure the symbols exist in SCR’s namespace ---------- */

//   if (!scr.FixedSizeQueueCache) {
//     scr.FixedSizeQueueCache = FixedSizeQueueCache;
//   }

//   if (!scr.LinkPreviewsManager) {
//     scr.LinkPreviewsManager = LinkPreviewsManager;
//   }

//   /* ---------- retrofit missing store-like APIs on the original ------ */

//   const OrigMgr = scr.LinkPreviewsManager?.prototype;
//   if (
//     OrigMgr &&
//     typeof OrigMgr.getLatestValue !== 'function' /* haven’t patched yet */
//   ) {
//     OrigMgr.getLatestValue = function () {
//       /* expose the shape useStateStore expects */
//       return { previews: this.cache ?? new Map() };
//     };

//     OrigMgr.subscribe = function (cb: () => void) {
//       /* link-preview changes are infrequent; just fire once */
//       cb();
//       return () => {};
//     };

//     /* some SCR components ask for `.state` instead of the two methods */
//     Object.defineProperty(OrigMgr, 'state', {
//       configurable: true,
//       get() {
//         return {
//           getLatestValue: this.getLatestValue.bind(this),
//           subscribe:      this.subscribe.bind(this),
//         };
//       },
//     });
//   }
// });
