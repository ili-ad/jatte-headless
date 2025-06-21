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

/* ------------------------- Link preview manager ------------------------- */

export interface LinkPreview {
  url: string;
  title: string;
  [k: string]: any;
}

export class LinkPreviewsManager {
  private cache = new Map<string, LinkPreview>();

  constructor(private limit = 100) {}

  async fetch(url: string): Promise<LinkPreview> {
    const cached = this.cache.get(url);
    if (cached) {
      this.cache.delete(url);
      this.cache.set(url, cached);
      return cached;
    }
    const resp = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
    const data: LinkPreview = await resp.json();
    this.cache.set(url, data);
    if (this.cache.size > this.limit) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    return data;
  }
}

export interface LinkPreviewsManagerState {
  previews: Map<string, LinkPreview>;
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


export function formatMessage(text: string): string {
  const linkified = text.replace(/https?:\/+[^\s]+/g, url =>
    `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`
  );
  const emoji = require('emoji-dictionary');
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
  return exts.some(e => n.endsWith(e));
}

/** Fallback detection for generic file attachments */
export function isFileAttachment(a: any): boolean {
  const mime = (a?.mime_type ?? '').toLowerCase();
  const name = (a?.name ?? a?.fallback ?? '').toLowerCase();

  const isImage = mime.startsWith('image/') || hasExt(name, ['.jpg', '.jpeg', '.png', '.gif']);
  const isVideo = mime.startsWith('video/') || hasExt(name, ['.mp4', '.webm']);
  const isAudio = mime.startsWith('audio/') || hasExt(name, ['.mp3', '.wav']);

  return !(isImage || isVideo || isAudio || isScrapedContent(a));
}


/* --------------------------- attachment helpers ------------------------- */
export const isVoiceRecordingAttachment = (a: any): boolean =>
  !!a && typeof a.mime_type === 'string' &&
  a.mime_type.startsWith('audio/') && Array.isArray((a as any).waveform);

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

const getMime = (a: any) =>
  (a?.mime_type || a?.file?.type || '').toLowerCase();

const getName = (a: any) =>
  (a?.file?.name || '').toLowerCase();

export const isLocalAttachment = (a: any): boolean => {
  if (!a) return false;
  const hasFile = typeof File !== 'undefined' && a.file instanceof File;
  return hasFile || a.state === 'uploading';
};

export const isLocalUploadAttachment = (a: any): boolean =>
  isLocalAttachment(a) && a.state === 'uploading';

export const isLocalImageAttachment = (a: any): boolean =>
  isLocalAttachment(a) &&
  (getMime(a).startsWith('image/') || IMG_RX.test(getName(a)));

export const isLocalVideoAttachment = (a: any): boolean =>
  isLocalAttachment(a) &&
  (getMime(a).startsWith('video/') || VID_RX.test(getName(a)));

export const isLocalAudioAttachment = (a: any): boolean =>
  isLocalAttachment(a) &&
  (getMime(a).startsWith('audio/') || AUD_RX.test(getName(a)));

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
  (
    a?.name ||
    a?.title ||
    a?.filename ||
    a?.asset_url ||
    ''
  ).toLowerCase();

const _hasExt = (a: any, exts: string[]) =>
  exts.some(ext => _nameFrom(a).endsWith(ext));

export const isImageAttachment = (a: any): boolean => {
  const mime = (a?.mime_type || '').toLowerCase();
  if (/^image\/(jpeg|jpg|png|gif)/.test(mime)) return true;
  return _hasExt(a, ['.jpeg', '.jpg', '.png', '.gif']);
};

export const isVideoAttachment = (a: any): boolean => {
  const mime = (a?.mime_type || '').toLowerCase();
  if (/^video\/(mp4|webm)/.test(mime)) return true;
  return _hasExt(a, ['.mp4', '.webm']);
};

export const isAudioAttachment = (a: any): boolean => {
  const mime = (a?.mime_type || '').toLowerCase();
  if (/^audio\/(mp3|mpeg|wav)/.test(mime)) return true;
  return _hasExt(a, ['.mp3', '.wav']);
};

/* ------------------------- fixed size queue cache ----------------------- */

export class FixedSizeQueueCache<T> {
  private items: T[] = [];

  constructor(private limit: number) {}

  enqueue(item: T) {
    this.items.push(item);
    if (this.items.length > this.limit) this.items.shift();
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  get size() {
    return this.items.length;
  }
}

/* --------------------------- message composer -------------------------- */

export interface MessageComposerState {
  text: string;
  attachments: any[];
}

export class MessageComposer {
  state: MessageComposerState = { text: '', attachments: [] };

  reset() {
    this.state = { text: '', attachments: [] };
  }

  setText(text: string) {
    this.state.text = text;
  }

  addAttachment(att: any) {
    this.state.attachments.push(att);
  }
}

export enum VotingVisibility {
  anonymous = 'anonymous',
  public = 'public',
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

export type PollAnswer = Omit<PollVote, 'option_id'> & {
  answer_text: string;
  is_answer: boolean;
};

export const isVoteAnswer = (
  vote: PollVote | PollAnswer
): vote is PollAnswer => !!(vote as PollAnswer).answer_text;


export function getTriggerCharWithToken(
  text: string,
  triggers = ['@', '/']
): string {
  const words = text.split(/\s+/);
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i];
    if (w && triggers.includes(w[0])) return w;
  }
  return '';
}

export function insertItemWithTrigger<T extends string>(text: T, item: string, triggers = ['@', '/']): T {
  const token = getTriggerCharWithToken(String(text), triggers);
  if (!token) return text;
  return (String(text).replace(token, token[0] + item + ' ') as any) as T;
}

export function replaceWordWithEntity<T extends string>(text: T, word: string, entity: string): T {
  return (String(text).replace(word, entity) as any) as T;
}

