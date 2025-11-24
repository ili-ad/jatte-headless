import mitt from 'mitt';
import { MiniStore } from './MiniStore';
import type { Message, ChatEvents } from './types';
import { ChatClient } from './ChatClient';
import { API, EVENTS } from './constants';
import { apiFetch } from '../api';
import { AuthError } from '../errors';
import { buildAttachmentManager } from './composer/attachments';
import { WS_BASE } from '@iliad/stream-chat-shim/config/env';

/* ──────────────────────────────────────────────────────────────── */
/*  CustomChannel  –  minimal Stream-Chat look-alike               */
/* ──────────────────────────────────────────────────────────────── */


export class Channel {
    readonly id: number;
    readonly uuid!: string;
    readonly cid: string;
    /** Channel type (always 'messaging' for now) */
    readonly type: string;
    data: { name: string } & Record<string, unknown>;

    private roomUuid!: string;

    private socket?: WebSocket;
    private emitter = mitt<ChatEvents>();
    /** Track optimistic messages so we can reconcile server echoes */
    private pendingMessages = new Map<string, true>();
    /** Track timers for typing indicators */
    private typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
    private typingStopTimer?: ReturnType<typeof setTimeout>;
    private hasActiveKeystroke = false;
    private readonly typingTimeoutMs = 8000;
    private readonly localTypingTimeoutMs = 5000;

    /* channel-local state object */
    private _state = {
        messages: [] as Message[],
        latestMessages: [] as Message[],
        messagePagination: { hasPrev: false, hasNext: false },
        pinnedMessages: [] as Message[],
        /** Remove any errored messages the UI might have inserted */
        filterErrorMessages: () => {
            const keep = this._state.messages.filter(m => (m as any).status !== 'failed');
            const keepLatest = this._state.latestMessages.filter(m => (m as any).status !== 'failed');
            this.bump({ messages: keep, latestMessages: keepLatest });
        },

        read: {} as Record<
            string,
            {
                last_read: Date;
                last_read_message_id?: string;
                unread_messages: number;
                user?: { id: string };
            }
        >,
        members: {} as Record<string, { user: { id: string } }>,
        typing: {} as Record<string, {
            user: { id: string; role?: string; name?: string };
            last_event_at: Date;
            parent_id?: string;
        }>,

        /* stub so <MessageInput> works */
        /* stub so <MessageInput> works */
        /* ──────────────── messageComposer shim ──────────────── */
        messageComposer: (() => {
            const channelRef = this;                         // capture parent
            let registered = false;
            const getRoomKey = () => `draft:${channelRef.uuid}`;

            /* load any previously‑saved draft */
            const loadDraft = () => {
                try { return localStorage.getItem(getRoomKey()) ?? ''; }
                catch { return ''; }
            };

            /* tiny reactive store for the text composer */
            const textStore = new MiniStore({
                text: loadDraft(),
                selection: { start: 0, end: 0 },
                suggestions: {
                    searchSource: { state: new MiniStore({ isLoadingItems: false }) },
                },
            });

            /* track timestamps for edits/drafts */
            const editingAuditState = new MiniStore({
                lastChange: {
                    draftUpdate: null as number | null,
                    stateUpdate: Date.now(),
                },
            });

            const logStateUpdateTimestamp = () => {
                const last = editingAuditState.getSnapshot().lastChange;
                editingAuditState._set({
                    lastChange: { ...last, stateUpdate: Date.now() },
                });
            };

            const logDraftUpdateTimestamp = () => {
                const ts = Date.now();
                editingAuditState._set({
                    lastChange: { draftUpdate: ts, stateUpdate: ts },
                });
            };

            return {
                contextType: 'message' as const,
                tag: 'root',

                /* ——— attachment manager ——— */
                attachmentManager: buildAttachmentManager({ jwt: channelRef.client['jwt'] }),

                /* ——— composer‑level stores ——— */
                state: new MiniStore({
                    quotedMessage: undefined as any,
                    showReplyInChannel: false,
                }),
                editingAuditState,
                linkPreviewsManager: (() => {
                    const store = new MiniStore({ previews: [] as any[] });
                    return {
                        state: store,
                        async add(url: string) {
                            const res = await apiFetch(API.LINK_PREVIEW, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${channelRef.client['jwt']}`,
                                },
                                body: JSON.stringify({ url }),
                            });
                            if (res.ok) {
                                const preview = await res.json();
                                const list = store.getSnapshot().previews;
                                store._set({ previews: [...list, preview] });
                            }
                        },
                        remove(url: string) {
                            const list = store.getSnapshot().previews;
                            store._set({ previews: list.filter((p: any) => p.url !== url) });
                        },
                        clear() {
                            store._set({ previews: [] });
                        },
                    };
                })(),
                pollComposer: {
                state: new MiniStore({
                    poll: undefined as any,
                }),
                async create(question: string, options: string[] = []) {
                    const res = await apiFetch(API.POLLS, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${channelRef.client['jwt']}`,
                        },
                        body: JSON.stringify({ question, options }),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        this.state._set({ poll: data.poll });
                    }
                },
                async remove() {
                    const poll = this.state.getSnapshot().poll;
                    if (!poll) return;
                    await apiFetch(`${API.POLLS}${poll.id}/`, {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${channelRef.client['jwt']}`,
                        },
                    }).catch(() => { /* ignore */ });
                    this.state._set({ poll: undefined });
                },
                reset() {
                    this.state._set({ poll: undefined });
                },
                },

                customDataManager: {
                state: new MiniStore({
                    customData: {} as Record<string, unknown>,
                }),
                set(k: string, v: unknown) {
                    const current = this.state.getSnapshot().customData;
                    this.state._set({ customData: { ...current, [k]: v } });
                },
                clear() { this.state._set({ customData: {} }); },
                },

                logStateUpdateTimestamp,
                logDraftUpdateTimestamp,
                async sendEditingAuditState() {
                    const token = channelRef.client['jwt'];
                    if (!token) return;
                    const { draftUpdate, stateUpdate } = editingAuditState.getSnapshot().lastChange;
                    await apiFetch(API.EDITING_AUDIT_STATE, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ draft_update: draftUpdate, state_update: stateUpdate }),
                    }).catch(() => { /* ignore network errors */ });
                },

                /* ------------- text‑composer impl ------------------- */
                textComposer: {
                state: textStore,

                insertText({ text }: { text: string }) {
                    const snap = textStore.getSnapshot();
                    const cur = snap.text ?? '';
                    const sel = snap.selection ?? { start: cur.length, end: cur.length };

                    const start = Math.max(0, Math.min(cur.length, sel.start));
                    const end   = Math.max(0, Math.min(cur.length, sel.end));

                    const next = cur.slice(0, start) + text + cur.slice(end);
                    const pos  = start + text.length;

                    textStore._set({ text: next, selection: { start: pos, end: pos } });
                    logStateUpdateTimestamp();
                },

                /* update helpers React calls */
                setText(text: string) {
                    textStore._set({ text });
                    logStateUpdateTimestamp();
                },

                setSelection(sel: { start: number; end: number }) {
                    textStore._set({ selection: sel });
                },

                clear() {
                    textStore._set({ text: '', selection: { start: 0, end: 0 } });
                    logStateUpdateTimestamp();
                },

                handleChange({
                    text,
                    selection,
                }: {
                    text: string;
                    selection: { start: number; end: number };
                }) {
                    textStore._set({ text, selection });
                    logStateUpdateTimestamp();
                },

                handleKeyEvent(evt: KeyboardEvent) {
                    if (evt.key === 'Enter' && !evt.shiftKey) {
                    evt.preventDefault();
                    this.submit();
                    }
                },

                /** ⇢ ACTUAL send logic */
                async submit() {
                    const snapshot = textStore.getSnapshot();
                    const draft = (snapshot.text ?? '').trim();
                    const userId = channelRef.client.user?.id ?? 'local-user';
                    if (!draft || !userId) return;

                    // Upstream reference: stream-chat `MessageComposer.compose` and
                    // stream-chat-react `Channel.sendMessage` generate a client
                    // message id, mark the optimistic payload as `sending`, and
                    // later replace it once the server echoes the message
                    // (see stream-chat `messageComposer.ts#compose` and
                    // stream-chat-react `Channel.tsx#doSendMessage`).
                    const clientGeneratedId = `local-${Date.now()}`;

                    const localMsg: Message & { status?: string; client_generated_id?: string } = {
                        id: clientGeneratedId,
                        client_generated_id: clientGeneratedId,
                        text: draft,
                        user_id: userId,
                        created_at: new Date().toISOString(),
                        status: 'sending',
                    };

                    channelRef.pendingMessages.set(clientGeneratedId, true);
                    channelRef.integrateIncomingMessage(localMsg, clientGeneratedId);

                    channelRef.emitter.emit(EVENTS.MESSAGE_NEW, {
                        type: EVENTS.MESSAGE_NEW,
                        message: localMsg,
                    });

                    // 🔸 fire real network request
                    channelRef
                        .sendMessage({ text: draft, client_generated_id: clientGeneratedId })
                        .catch(console.error);

                    // clear draft + saved localStorage copy, without relying on `this`
                    textStore._set({
                        text: '',
                        selection: { start: 0, end: 0 },
                    });
                    logStateUpdateTimestamp();

                    try {
                        localStorage.removeItem(getRoomKey());
                    } catch {
                        // non‑browser / quota issues – ignore
                    }
                },
                }, // ← end of textComposer



                /* -----  place INSIDE  messageComposer: { … }  ----- */

                /* 1️⃣  Is there anything to send? */
                get compositionIsEmpty() {
                    return this.textComposer.state.getSnapshot().text.trim() === '';
                },

                /* 2️⃣  Check if any payload (text, attachment, poll, custom) is present */
                // get hasSendableData() {
                //     const text = this.textComposer.state.getSnapshot().text.trim();
                //     const atts = this.attachmentManager.state.getSnapshot().attachments;
                //     const poll = this.pollComposer.state.getSnapshot().poll;
                //     const custom = this.customDataManager.state.getSnapshot().customData;
                //     return (
                //         text !== '' ||
                //         atts.length > 0 ||
                //         !!poll ||
                //         Object.keys(custom).length > 0
                //     );
                // },
                get hasSendableData() {
                    const text = this.textComposer.state.getSnapshot().text;
                    return text != null && text.trim() !== '';
                },                

                /* 2️⃣  Build the composition object that <MessageInput> expects */
                // async compose() {
                //     if (this.compositionIsEmpty) return undefined;

                //     const userId = channelRef.client.user?.id;
                //     if (!userId) return undefined;

                //     const text = this.textComposer.state.getSnapshot().text.trim();
                //     const now = new Date().toISOString();
                //     const localMessage: Message = {
                //         id: `local-${Date.now()}`,
                //         text,
                //         user_id: userId,
                //         created_at: now,
                //     };

                //     /* sendOptions can stay empty for MVP */
                //     return { localMessage, message: localMessage, sendOptions: {} };
                // },

                async compose() {
                    const userId = channelRef.client.user?.id;
                    const text = this.textComposer.state.getSnapshot().text.trim();
                    if (!userId || !text) return undefined;

                    const now = new Date().toISOString();
                    const id = `local-${Date.now()}`;
                    const localMessage: Message & { status?: string; client_generated_id?: string } = {
                        id,
                        client_generated_id: id,
                        text,
                        user_id: userId,
                        created_at: now,
                        status: 'sending',
                    };

                    return { localMessage, message: localMessage, sendOptions: {} };
                },
                /* 3️⃣  Called by useSubmitHandler (send-button / Enter) */
                async sendMessage(
                    _localMessage: Message,
                    message: Message,
                    _opts: unknown,
                ) {
                    /* optimistic echo already done in textComposer.submit() */
                    await channelRef.sendMessage({
                        text: message.text,
                        client_generated_id: (message as any).client_generated_id,
                    });
                },




                /* ------------- expose submit for <MessageInput> ------ */
                submit() {        // <── NEW line
                    this.textComposer.submit();
                },

                /* ——— subscriptions & drafts ——— */
                registerSubscriptions() {
                    const handler = this.logStateUpdateTimestamp;
                    const unsubs = [
                        textStore.subscribe(handler),
                        this.attachmentManager.state.subscribe(handler),
                        this.linkPreviewsManager.state.subscribe(handler),
                        this.pollComposer.state.subscribe(handler),
                        this.customDataManager.state.subscribe(handler),
                    ];
                    const token = channelRef.client['jwt'];
                    if (token && !registered) {
                        registered = true;
                        apiFetch(API.REGISTER_SUBSCRIPTIONS, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                        }).catch(() => { /* ignore network errors */ });
                    }
                    return () => { unsubs.forEach(fn => fn()); };
                },
                createDraft() {
                    const text = textStore.getSnapshot().text;
                    localStorage.setItem(getRoomKey(), text);
                    const token = channelRef.client['jwt'];
                    if (token) {
                        apiFetch(`/rooms/${channelRef.uuid}/draft/`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ text }),
                        }).catch(() => { /* ignore network errors */ });
                    }
                    logDraftUpdateTimestamp();
                    this.sendEditingAuditState();
                },
                discardDraft() { 
                    localStorage.removeItem(getRoomKey()); 
                    logDraftUpdateTimestamp(); 
                    this.sendEditingAuditState(); 
                },

                /** Current draft text */
                get draft() { return textStore.getSnapshot().text; },
                set draft(v: string) { textStore._set({ text: v }); },

                /** Fetch draft from the backend and sync local state */
                async getDraft() {
                    const token = channelRef.client['jwt'];
                    if (!token) return '';
                    const res = await apiFetch(`/rooms/${channelRef.uuid}/draft/`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) throw new Error('getDraft failed');
                    const data = await res.json().catch(() => []);
                    const drafts = Array.isArray(data) ? data : [];
                    const firstDraft = drafts[0] ?? {};
                    const text =
                        typeof firstDraft.text === 'string'
                            ? firstDraft.text
                            : typeof firstDraft.body === 'string'
                              ? firstDraft.body ?? ''
                              : '';
                    textStore._set({ text });
                    return text;
                },

                // pollComposer: {
                // state: new MiniStore({            // shape is all Stream-UI needs
                //     question: '', options: [] as any[],
                // }),
                // /* Stream-UI calls .reset() when you close the poll modal */
                // reset() { this.state._set({ question: '', options: [] }); },
                // },

                /* ----- custom-data manager (attachments of unknown kinds) -------*/
                // customDataManager: {
                // state: new MiniStore({ custom: [] as any[] }),
                // reset()   { this.state._set({ custom: [] }); },
                // addData() {/* noop for MVP */},
                // },                
                /* ——— config flags ——— */
                configState: new MiniStore({
                    attachments: {
                        acceptedFiles: [] as File[],
                        maxNumberOfFilesPerMessage: 10,
                    },
                    text: { enabled: true },
                    multipleUploads: true,
                    isUploadEnabled: true,
                }),
                get config() { return this.configState.getLatestValue(); },
                async getConfigState() {
                    const token = channelRef.client["jwt"];
                    const res = await apiFetch(`/rooms/${channelRef.uuid}/config-state`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) throw new Error("getConfigState failed");
                    const data = await res.json().catch(() => ({}));
                    this.configState._set(data);
                    return this.configState.getLatestValue();
                },

                /* ——— simple passthrough helpers ——— */
                getInputValue() { return textStore.getSnapshot().text; },
                setInputValue(v: string) { textStore._set({ text: v }); },
                reset() { this.textComposer.clear(); },

                /** Update quoted message for replies */
                setQuotedMessage(msg: Message | undefined) {
                    this.state._set({ quotedMessage: msg });
                    const token = channelRef.client['jwt'];
                    if (token) {
                        apiFetch(API.QUOTED_MESSAGE, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ quoted_message: msg ?? null }),
                        }).catch(() => { /* ignore network errors */ });
                    }
                },

                /** Currently edited message, if any */
                editedMessage: undefined as Message | undefined,

                /** Parent message id for thread replies */
                threadId: undefined as string | undefined,

                /** Set the message being edited and sync text composer */
                setEditedMessage(msg: Message | undefined) {
                    (this as any).editedMessage = msg;
                    const text = msg ? msg.text : '';
                    textStore._set({ text });
                },

                /** Set the current thread id */
                setThreadId(id: string | undefined) {
                    (this as any).threadId = id;
                },

                /** Toggle whether replies are shown in-channel */
                toggleShowReplyInChannel() {
                    const cur = this.state.getSnapshot().showReplyInChannel;
                    this.state._set({ showReplyInChannel: !cur });
                },

                /** Current flag for showing replies in-channel */
                get showReplyInChannel() {
                    return this.state.getSnapshot().showReplyInChannel;
                },

                /** Reset composer state optionally from an existing message */
                initState({ composition }: { composition?: Message } = {}) {
                    this.attachmentManager.state._set({ attachments: [] });
                    this.linkPreviewsManager.state._set({ previews: [] });
                    this.pollComposer.state._set({ poll: undefined as any });
                    this.customDataManager.clear();
                    this.state._set({ quotedMessage: undefined });
                    this.editingAuditState._set({
                        lastChange: { draftUpdate: null, stateUpdate: Date.now() },
                    });
                    this.textComposer.clear();
                    if (composition) {
                        this.setEditedMessage(composition);
                    } else {
                        this.setEditedMessage(undefined);
                    }
                },

                /** Clear composer state and discard any stored draft */
                clear() {
                    this.initState();
                    const token = channelRef.client['jwt'];
                    if (token) {
                        apiFetch(`/rooms/${channelRef.uuid}/draft/`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` },
                        }).catch(() => { /* ignore network errors */ });
                    }
                },
            };
        })(),   // end of IIFE
    };         // ←———————— END of _state object

    /** 🔹 expose the same object on the channel itself */
    readonly messageComposer = this._state.messageComposer;

    /** Stream-UI pulls from here via `useStateStore` */
    readonly stateStore = new MiniStore(this._state);

    initialized = false;


    constructor(
        id: number,
        uuid: string,
        roomName: string,
        private client: ChatClient,
        extraData: Record<string, unknown> = {},
    ) {
        this.id = id;
        this.uuid = uuid;
        this.roomUuid = uuid;
        this.type = 'messaging';
        this.cid = `${this.type}:${this.uuid}`;
        this.data = { name: roomName, ...extraData };
    }

    /* ─── getters Stream-UI expects ─── */
    get state() { return this._state; }
    /** Convenience getter exposing current message list */
    get messages() { return this._state.messages; }
    /** Return current members map */
    get members() { return this._state.members; }

    /** Whether this channel is hidden */
    get hidden() { return !!this.data.hidden; }

    /** Whether this channel is visible */
    get visible() { return !this.hidden; }

    /** Whether this channel has been truncated */
    get truncated() { return !!this.data.truncated; }

    /** Human readable channel name if provided */
    get name() { return this.data.name; }

    /** Return the parent ChatClient instance */
    getClient() { return this.client; }

    // at top of file you already have: import { API, apiFetch } from '@/lib/api';

    /**
     * Config stub for the Stream UI.
     *
     * Upstream components call `channel.getConfig()` to decide what inputs
     * are enabled. Our Django `/rooms/<uuid>/config` endpoint isn't really
     * wired up yet (it's returning 400s), and we don’t need dynamic config
     * to send messages.
     *
     * So:
     *   - we never throw
     *   - we prefer any config already hanging off the messageComposer
     *   - otherwise we return a small static “everything enabled” config
     */
    // async getConfig(): Promise<any> {
    //     // If the composer exposes a config object, use that first.
    //     const composer: any = (this as any).messageComposer;
    //     if (composer && composer.config) {
    //         return composer.config;
    //     }

    //     // Minimal hard‑coded config that keeps Stream UI happy.
    //     return {
    //         text: { enabled: true },
    //         multipleUploads: true,
    //         isUploadEnabled: true,
    //         attachments: {
    //             maxNumberOfFilesPerMessage: 10,
    //             // you can add more flags here later if the UI starts reading them
    //         },
    //     };
    // }
    async getConfig(): Promise<any> {
    try {
        // go through the composer-level store you defined
        return await this.messageComposer.getConfigState();
    } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
        console.warn('[Channel.getConfig] falling back to empty config', err);
        }
        return {}; // never throw; Stream UI only needs a shape
    }
    }




    countUnread() {
        const userId = this.client.user?.id;
        if (!userId) return 0;
        const me = this._state.read[userId];
        return me ? me.unread_messages : 0;
    }
    lastRead() {
        const userId = this.client.user?.id;
        if (!userId) return undefined;
        const me = this._state.read[userId];
        return me ? new Date(me.last_read) : undefined;
    }

    /** Fetch read states for this channel */
    async read() {
    const res = await apiFetch(`/rooms/${this.uuid}/read`, {
        headers: { Authorization: `Bearer ${this.client['jwt']}` },
    });
    if (!res.ok) throw new Error('read failed');

    // Backend returns strings here.
    const list = (await res.json()) as {
        user: string;
        last_read: string;
        unread_messages: number;
    }[];

    const map: Record<
        string,
        { last_read: Date; unread_messages: number; user: { id: string } }
    > = {};

    for (const item of list) {
        map[item.user] = {
        last_read: new Date(item.last_read),  // <-- convert string → Date
        unread_messages: item.unread_messages,
        user: { id: item.user },
        };
    }

    this.bump({ read: map });
    return map;
    }


    /* ─── main lifecycle ─── */
    /** Fetch initial state without opening a websocket */
    async query() {
        try {
            const res = await apiFetch(`${API.ROOMS}${this.uuid}/messages/`, {
                headers: { Authorization: `Bearer ${this.client['jwt']}` },
            });
            if (res.ok) {
                const first: Message[] = await res.json();
                const me = this.client.user?.id;
                if (me) {
                    this.bump({
                        messages: first,
                        latestMessages: first,
                        read: {
                            ...this._state.read,
                            [me]: {
                                last_read: new Date(),
                                last_read_message_id: first.at(-1)?.id,
                                unread_messages: 0,
                            },
                        },
                    });
                } else {
                    this.bump({ messages: first, latestMessages: first });
                }
            }

            const memRes = await apiFetch(`${API.ROOMS}${this.uuid}/members/`, {
                headers: { Authorization: `Bearer ${this.client['jwt']}` },
            });
            if (memRes.ok) {
                const list = (await memRes.json()) as { id: string }[];
                const map: Record<string, { user: { id: string } }> = {};
                for (const m of list) map[m.id] = { user: { id: m.id } };
                this.bump({ members: map });
            }
        } catch {
            /* ignore network errors */
        }
        this.initialized = true;
    }

    async watch() {
        if (this.socket) return;
        this.client.activeChannels[this.cid] = this;

        /* initial history + read row */
        try {
            const res = await apiFetch(`${API.ROOMS}${this.uuid}/messages/`, {
                headers: { Authorization: `Bearer ${this.client['jwt']}` },
            });
            if (res.ok) {
                const first: Message[] = await res.json();
                const me = this.client.user?.id;
                if (!me) return;
                this.bump({
                    messages: first,
                    latestMessages: first,                   // 🔹 keep mirror
                    read: {
                        ...this._state.read,
                        [me]: {
                            last_read: new Date(),
                            last_read_message_id: first.at(-1)?.id,
                            unread_messages: 0
                        }
                    },
                });
            }

            const memRes = await apiFetch(`${API.ROOMS}${this.uuid}/members/`, {
                headers: { Authorization: `Bearer ${this.client['jwt']}` },
            });
            if (memRes.ok) {
                const list = await memRes.json() as { id: string }[];
                const map: Record<string, { user: { id: string } }> = {};
                for (const m of list) map[m.id] = { user: { id: m.id } };
                this.bump({ members: map });
            }

        } catch {/* fine for MVP */ }

        this.initialized = true;

        /* web-socket for live updates */
        // const wsRoot = process.env.NEXT_PUBLIC_WS_URL;
        // if (!wsRoot) {
        //     throw new Error('NEXT_PUBLIC_WS_URL is not set');
        // }
        // this.socket = new WebSocket(
        //     `${wsRoot}/ws/${this.cid}/?token=${this.client['jwt']}`,
        // );

        this.socket = new WebSocket(
            `${WS_BASE}/ws/${this.cid}/?token=${encodeURIComponent(this.client['jwt'] ?? '')}`
        );


        this.socket.onmessage = (ev) => {
            try {
                const p = JSON.parse(ev.data);
                switch (p.type) {
                    case 'message': {
                        const msg = p.data as Message & { client_generated_id?: string };
                        this.integrateIncomingMessage(
                            { ...msg, status: (msg as any).status ?? 'received' },
                            msg.client_generated_id,
                        );
                        this.emitter.emit(EVENTS.MESSAGE_NEW, { type: EVENTS.MESSAGE_NEW, message: msg });
                        break;
                    }
                    case 'typing.start':
                    case 'typing.stop':
                        this.applyTypingEvent({ type: p.type, user_id: p.user_id } as any);
                        this.emitter.emit(p.type, { type: p.type, cid: this.cid, user_id: p.user_id } as any);
                        this.client.emit(p.type as any, { type: p.type, cid: this.cid, user_id: p.user_id } as any);
                        break;
                }
            } catch { console.error('bad WS', ev.data); }
        };
    }

    async markRead() {
        const me = this.client.user?.id;
        const lastId = this._state.latestMessages.at(-1)?.id;
        if (me) {
            apiFetch(`/rooms/${this.uuid}/mark_read`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.client['jwt']}`,
                },
            }).catch(() => { /* network errors ignored */ });
        }
        if (me) {
            this.bump({
                read: {
                    ...this._state.read,
                    [me]: {
                        last_read: new Date(),
                        last_read_message_id: lastId,
                        unread_messages: 0,
                    },
                },
            });
        }
    }

    async markUnread() {
        const me = this.client.user?.id;
        if (me) {
            apiFetch(`/rooms/${this.uuid}/mark_unread`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.client['jwt']}`,
                },
            }).catch(() => { /* network errors ignored */ });

            const { [me]: _removed, ...rest } = this._state.read;
            this.bump({ read: rest });
        }
    }

    /** Notify the backend (and local state) that the user is typing */
    async keystroke(): Promise<void> {
        const userId = this.getCurrentUserId();
        if (!userId) return;

        if (!this.hasActiveKeystroke) {
            // TODO backend-wire-up: when server supports typing, this dispatchEvent
            // should result in a websocket broadcast to other members.
            this.client.dispatchEvent({ type: 'typing.start', cid: this.cid, user_id: userId } as any);
            this.hasActiveKeystroke = true;
        }

        this.scheduleLocalTypingStop();
    }

    /** Notify listeners that the user stopped typing */
    async stopTyping(): Promise<void> {
        const userId = this.getCurrentUserId();
        if (!userId) return;

        if (this.typingStopTimer) {
            clearTimeout(this.typingStopTimer);
            this.typingStopTimer = undefined;
        }

        if (!this.hasActiveKeystroke) return;
        this.hasActiveKeystroke = false;

        this.client.dispatchEvent({ type: 'typing.stop', cid: this.cid, user_id: userId } as any);
    }

    /** Simulate an external typing.start event (e.g. agent responses) */
    simulateTypingStart(userId: string) {
        const payload = {
            type: 'typing.start',
            cid: this.cid,
            user: this.client.state.users[userId] ?? this._state.members[userId]?.user ?? { id: userId },
            user_id: userId,
        } as any;
        this.applyTypingEvent(payload);
        this.emitter.emit('typing.start' as any, payload);
        this.client.emit('typing.start' as any, payload);
    }

    /** Simulate an external typing.stop event (e.g. agent responses) */
    simulateTypingStop(userId: string) {
        const payload = { type: 'typing.stop', cid: this.cid, user_id: userId } as any;
        this.applyTypingEvent(payload);
        this.emitter.emit('typing.stop' as any, payload);
        this.client.emit('typing.stop' as any, payload);
    }


    /** Network-level send that also updates local state & fires EVENTS.MESSAGE_NEW */
    /** Network-level send that also updates local state & fires EVENTS.MESSAGE_NEW */
    // async sendMessage({ text }: { text: string }) {
    //     const custom = this.messageComposer.customDataManager.state.getSnapshot().customData;
    //     const poll = this.messageComposer.pollComposer.state.getSnapshot().poll;

    //     // Backend expects `body` as the message text field
    //     const payload: any = { body: text };

    //     if (Object.keys(custom).length) payload.custom_data = custom;
    //     if (poll) payload.poll = poll;

    //     const threadId = this.messageComposer.threadId;
    //     if (threadId) payload.reply_to = threadId;

    //     if (this.messageComposer.state.getSnapshot().showReplyInChannel) {
    //         payload.show_in_channel = true;
    //     }

    //     const res = await apiFetch(`${API.ROOMS}${this.uuid}/messages/`, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             Authorization: `Bearer ${this.client['jwt']}`,
    //         },
    //         body: JSON.stringify(payload),
    //     });

    //     if (!res.ok) throw new Error('sendMessage failed');

    //     const msg = (await res.json()) as Message;

    //     // push to state
    //     this.bump({
    //         messages: [...this._state.messages, msg],
    //         latestMessages: [...this._state.latestMessages.slice(-49), msg],
    //     });

    //     // global bus notify
    //     this.client.emit(EVENTS.MESSAGE_NEW, { message: msg });

    //     this.messageComposer.customDataManager.clear();
    //     this.messageComposer.pollComposer.state._set({ poll: undefined as any });

    //     return msg;
    // }

    /** Network-level send that also updates local state & fires EVENTS.MESSAGE_NEW */
    async sendMessage({ text, client_generated_id }: { text: string; client_generated_id?: string }) {
        const custom = this.messageComposer.customDataManager.state.getSnapshot().customData;
        const poll = this.messageComposer.pollComposer.state.getSnapshot().poll;
        //const payload: any = { body: text };
        const payload: any = { body: text, text };   // send both
        if (client_generated_id) {
            payload.client_generated_id = client_generated_id;
            payload.pending_message_metadata = { client_generated_id } as any;
        }
        if (Object.keys(custom).length) payload.custom_data = custom;
        if (poll) payload.poll = poll;
        const threadId = this.messageComposer.threadId;
        if (threadId) payload.reply_to = threadId;
        if (this.messageComposer.state.getSnapshot().showReplyInChannel) {
            payload.show_in_channel = true;
        }
        const res = await apiFetch(`${API.ROOMS}${this.uuid}/messages/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.client['jwt']}`,
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('sendMessage failed');
        const msg = (await res.json()) as Message & { client_generated_id?: string };
        if (client_generated_id) this.pendingMessages.delete(client_generated_id);

        this.integrateIncomingMessage(
            { ...msg, status: 'received', client_generated_id: msg.client_generated_id ?? client_generated_id },
            client_generated_id,
        );

        this.client.emit(EVENTS.MESSAGE_NEW, { message: msg });
        this.messageComposer.customDataManager.clear();
        this.messageComposer.pollComposer.state._set({ poll: undefined as any });
        return msg;
    }



    /** Delete a message by id */
    async deleteMessage(messageId: string) {
        const res = await apiFetch(`${API.MESSAGES}${messageId}/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('deleteMessage failed');
        const updated = await res.json() as Message;
        this.bump({
            messages: this._state.messages.map(m => m.id === messageId ? updated : m),
            latestMessages: this._state.latestMessages.map(m => m.id === messageId ? updated : m),
        });
        return updated;
    }

    /** Update a message's text */
    /** Update a message's text */
    async updateMessage(messageId: string, text: string) {
        const res = await apiFetch(`${API.MESSAGES}${messageId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.client['jwt']}`,
            },
            // Backend also expects `body` here
            body: JSON.stringify({ body: text, text }),
        });

        if (!res.ok) throw new Error('updateMessage failed');

        const updated = (await res.json()) as Message;

        this.bump({
            messages: this._state.messages.map((m) =>
                m.id === messageId ? updated : m
            ),
            latestMessages: this._state.latestMessages.map((m) =>
                m.id === messageId ? updated : m
            ),
        });

        return updated;
    }


    /** Fetch a single message by id and update local state */
    async editedMessage(messageId: string) {
        const res = await apiFetch(`${API.MESSAGES}${messageId}/`, {
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('editedMessage failed');
        const msg = await res.json() as Message;
        this.bump({
            messages: this._state.messages.map(m => m.id === messageId ? msg : m),
            latestMessages: this._state.latestMessages.map(m => m.id === messageId ? msg : m),
        });
        return msg;
    }

    /** Restore a previously deleted message */
    async restore(messageId: string) {
        const res = await apiFetch(`${API.MESSAGES}${messageId}/restore/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('restore failed');
        const updated = await res.json() as Message;
        this.bump({
            messages: this._state.messages.map(m => m.id === messageId ? updated : m),
            latestMessages: this._state.latestMessages.map(m => m.id === messageId ? updated : m),
        });
        return updated;
    }

    /** Send a reaction to a message */
    async sendReaction(messageId: string, type: string) {
        const res = await apiFetch(`${API.MESSAGES}${messageId}/reactions/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.client['jwt']}`,
            },
            body: JSON.stringify({ type }),
        });
        if (!res.ok) throw new Error('sendReaction failed');
        return await res.json();
    }

    /** Send an action for a message */
    async sendAction(messageId: string, action: Record<string, unknown>) {
        const res = await apiFetch(`${API.MESSAGES}${messageId}/actions/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.client['jwt']}`,
            },
            body: JSON.stringify(action),
        });
        if (!res.ok) throw new Error('sendAction failed');
        return await res.json();
    }

    /** Flag a message for moderation */
    async flagMessage(messageId: string) {
        const res = await apiFetch(`${API.MESSAGES}${messageId}/flag/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('flagMessage failed');
        return await res.json();
    }

    /** Pin a message */
    async pin(messageId: string) {
        const res = await apiFetch(`${API.MESSAGES}${messageId}/pin/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('pin failed');
    }

    /** Unpin a message */
    async unpin(messageId: string) {
        const res = await apiFetch(`${API.MESSAGES}${messageId}/unpin/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('unpin failed');
    }

    /** Fetch pinned messages for this channel */
    async pinnedMessages() {
        const res = await apiFetch(`/rooms/${this.uuid}/pinned`, {
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('pinnedMessages failed');
        const list = await res.json() as Message[];
        this.bump({ pinnedMessages: list });
        return list;
    }

    /** Fetch reactions for a given message */
    async queryReactions(messageId: string) {
        const res = await apiFetch(`${API.MESSAGES}${messageId}/reactions/`, {
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('queryReactions failed');
        return await res.json() as any[];
    }
    /** Delete a reaction */
    async deleteReaction(messageId: string, reactionId: string) {
        const res = await apiFetch(`${API.MESSAGES}${messageId}/reactions/${reactionId}/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('deleteReaction failed');

    }

    /** Fetch replies to a given message */
    async getReplies(messageId: string) {
        const res = await apiFetch(`${API.MESSAGES}${messageId}/replies/`, {
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('getReplies failed');
        return await res.json() as Message[];
    }

    /** Archive this channel */
    async archive() {
        const res = await apiFetch(`/rooms/${this.uuid}/archive`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('archive failed');
    }

    /** Unarchive this channel */
    async unarchive() {
        const res = await apiFetch(`/rooms/${this.uuid}/unarchive`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('unarchive failed');
    }

    /** Hide this channel */
    async hide() {
        const res = await apiFetch(`/rooms/${this.uuid}/hide`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('hide failed');
        this.data.hidden = true;
    }

    /** Show this channel */
    async show() {
        const res = await apiFetch(`/rooms/${this.uuid}/show`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('show failed');
        this.data.hidden = false;
    }

    /** Remove all messages from this channel */
    async truncate() {
        const res = await apiFetch(`/rooms/${this.uuid}/truncate/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('truncate failed');
        this.bump({ messages: [], latestMessages: [] });
        this.data.truncated = true;
    }

    /** Fetch cooldown value for this channel */
    async cooldown() {
        const res = await apiFetch(`${API.COOLDOWN}${this.uuid}/cooldown/`, {
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('cooldown failed');
        const data = await res.json() as { cooldown: number };
        return data.cooldown;
    }

    /* event helpers */
    on = this.emitter.on as any;
    off = this.emitter.off as any;

    /**
     * Dispatch an incoming event to this channel.
     * Supports message.new and typing events.
     */
    dispatchEvent(event: { type: string; message?: Message; user_id?: string }) {
        switch (event.type) {
            case EVENTS.MESSAGE_NEW:
                if (event.message) {
                    this.integrateIncomingMessage(
                        event.message,
                        (event.message as any).client_generated_id as string | undefined,
                    );
                }
                this.emitter.emit(EVENTS.MESSAGE_NEW, event as any);
                break;
            case 'typing.start':
            case 'typing.stop':
                const payload = { cid: this.cid, ...event } as any;
                this.applyTypingEvent(payload);
                this.emitter.emit(event.type as any, payload);
                break;
            default:
                this.emitter.emit(event.type as any, event as any);
        }
    }

    /* internal: mutate + notify React */
    /* tiny helper that mutates state *and* notifies both stores */
    private bump(patch: Partial<typeof this._state>) {
        // debug
        // eslint-disable-next-line no-console
        console.log('[Channel.bump]', patch);

        this._state = { ...this._state, ...patch };
        this.stateStore.dispatch(patch);     // ← keep channel store current
        this.client.stateStore.dispatch({}); // ← nudge parent Chat to re-render
    }

    private getCurrentUserId() {
        return this.client.user?.id ?? (this.client as any)._user?.id ?? null;
    }

    private clearTypingUser(userId: string, emitEvent = false) {
        const timer = this.typingTimers.get(userId);
        if (timer) {
            clearTimeout(timer);
            this.typingTimers.delete(userId);
        }

        if (this._state.typing[userId]) {
            const { [userId]: _removed, ...rest } = this._state.typing;
            this.bump({ typing: rest });

            if (emitEvent) {
                const payload = { type: 'typing.stop', cid: this.cid, user_id: userId } as any;
                this.emitter.emit('typing.stop' as any, payload);
                this.client.emit('typing.stop' as any, payload);
            }
        }
    }

    private scheduleTypingExpiry(userId: string) {
        const existingTimer = this.typingTimers.get(userId);
        if (existingTimer) clearTimeout(existingTimer);

        const timer = setTimeout(() => {
            this.clearTypingUser(userId, true);
        }, this.typingTimeoutMs);

        this.typingTimers.set(userId, timer);
    }

    private applyTypingEvent(event: { type: 'typing.start' | 'typing.stop'; user?: { id?: string; role?: string; name?: string }; user_id?: string; parent_id?: string }) {
        const userId = event.user?.id ?? event.user_id;
        const currentUserId = this.getCurrentUserId();

        if (!userId) return;

        // ignore our own typing updates in the shared state
        if (currentUserId && userId === currentUserId) {
            if (event.type === 'typing.stop') this.clearTypingUser(userId);
            return;
        }

        if (event.type === 'typing.stop') {
            this.clearTypingUser(userId);
            return;
        }

        const user = event.user ?? this._state.members[userId]?.user ?? { id: userId };
        const typingEntry = { user: { id: user.id!, role: user.role, name: user.name }, last_event_at: new Date(), parent_id: event.parent_id };
        this.bump({ typing: { ...this._state.typing, [userId]: typingEntry } });
        this.scheduleTypingExpiry(userId);
    }

    private scheduleLocalTypingStop() {
        if (this.typingStopTimer) clearTimeout(this.typingStopTimer);

        this.typingStopTimer = setTimeout(() => {
            void this.stopTyping();
        }, this.localTypingTimeoutMs);
    }

    private integrateIncomingMessage(incoming: Message, matchId?: string) {
        const authorId = (incoming as any).user?.id ?? (incoming as any).user_id;
        if (authorId) this.clearTypingUser(authorId, true);

        const matcher = (m: Message) =>
            m.id === incoming.id ||
            (!!matchId && (m.id === matchId || (m as any).client_generated_id === matchId));

        let nextMessages = [...this._state.messages];
        const existingIndex = nextMessages.findIndex(matcher);

        if (existingIndex !== -1) {
            const merged = { ...nextMessages[existingIndex], ...incoming } as Message;
            merged.id = incoming.id ?? nextMessages[existingIndex].id;
            nextMessages[existingIndex] = merged;
        } else {
            nextMessages.push(incoming);
        }

        if (matchId && incoming.id && incoming.id !== matchId) {
            nextMessages = nextMessages.filter((msg, idx) => {
                if (idx === existingIndex) return true;
                return msg.id !== matchId;
            });
        }

        const orderedMessages = this.sortAndDedupeMessages(nextMessages);
        const latestMessages = orderedMessages.slice(-50);

        this.bump({ messages: orderedMessages, latestMessages });
    }

    private sortAndDedupeMessages(list: Message[]) {
        const map = new Map<string, Message>();
        for (const msg of list) {
            const prev = map.get(msg.id);
            map.set(msg.id, prev ? { ...prev, ...msg } : msg);
        }

        return Array.from(map.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
    }
}