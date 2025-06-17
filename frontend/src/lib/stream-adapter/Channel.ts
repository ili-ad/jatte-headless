import mitt from 'mitt';
import { MiniStore } from './MiniStore';
import type { Message, ChatEvents } from './types';   // ⬅ add this
import { ChatClient } from './ChatClient';
import { API, EVENTS } from './constants';

/* ──────────────────────────────────────────────────────────────── */
/*  CustomChannel  –  minimal Stream-Chat look-alike               */
/* ──────────────────────────────────────────────────────────────── */


export class Channel {
    readonly id: number;
    readonly uuid!: string;
    readonly cid: string;
    data: { name: string } & Record<string, unknown>;

    private roomUuid!: string;

    private socket?: WebSocket;
    private emitter = mitt<ChatEvents>();

    /* channel-local state object */
    private _state = {
        messages: [] as Message[],
        latestMessages: [] as Message[],
        messagePagination: { hasPrev: false, hasNext: false },
        pinnedMessages: [] as Message[],

        read: {} as Record<
            string,
            {
                last_read: string;
                last_read_message_id?: string;
                unread_messages: number;
                user?: { id: string };
            }
        >,
        members: {} as Record<string, { user: { id: string } }>,

        /* stub so <MessageInput> works */
        /* stub so <MessageInput> works */
        /* ──────────────── messageComposer shim ──────────────── */
        messageComposer: (() => {
            const channelRef = this;                         // capture parent
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

                /* ——— attachment manager stub ——— */
                attachmentManager: {
                    state: new MiniStore({ attachments: [] as any[] }),
                    availableUploadSlots: 10,
                    addFiles: (_: File[]) => { },
                    removeAttachment: (_: string) => { },
                    replaceAttachment: (_o: any, _n: any) => { },
                },

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
                            const res = await fetch(API.LINK_PREVIEW, {
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
                    const res = await fetch(API.POLLS, {
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
                    await fetch(`${API.POLLS}${poll.id}/`, {
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

                /* ------------- text‑composer impl ------------------- */
                textComposer: {
                    state: textStore,

                    /* update helpers React calls */
                    setText(text: string) { textStore._set({ text }); logStateUpdateTimestamp(); },
                    setSelection(sel: { start: number; end: number }) { textStore._set({ selection: sel }); },
                    clear() { textStore._set({ text: '', selection: { start: 0, end: 0 } }); logStateUpdateTimestamp(); },

                    handleChange({ text, selection }: { text: string; selection: { start: number; end: number } }) {
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
                        const draft = textStore.getSnapshot().text.trim();
                        if (!draft) return;

                        /* 🔸 optimistic echo so the list updates immediately */
                        const localMsg: Message = {
                            id: `local-${Date.now()}`,
                            text: draft,
                            user_id: channelRef.client.user.id!,
                            created_at: new Date().toISOString(),
                        };
                        channelRef.bump({
                            messages: [...channelRef.state.messages, localMsg],
                            latestMessages: [...channelRef.state.latestMessages.slice(-49), localMsg],
                        });
                        channelRef.emitter.emit(EVENTS.MESSAGE_NEW, { type: EVENTS.MESSAGE_NEW, message: localMsg });

                        /* 🔸 fire the real network request (no await needed for UX) */
                        channelRef.sendMessage({ text: draft })
                            .catch(console.error);

                        /* clear draft + saved localStorage copy */
                        this.clear();
                        localStorage.removeItem(getRoomKey());
                    },
                },  /* ← end of textComposer */


                /* -----  place INSIDE  messageComposer: { … }  ----- */

                /* 1️⃣  Is there anything to send? */
                get compositionIsEmpty() {
                    return this.textComposer.state.getSnapshot().text.trim() === '';
                },

                /* 2️⃣  Check if any payload (text, attachment, poll, custom) is present */
                get hasSendableData() {
                    const text = this.textComposer.state.getSnapshot().text.trim();
                    const atts = this.attachmentManager.state.getSnapshot().attachments;
                    const poll = this.pollComposer.state.getSnapshot().poll;
                    const custom = this.customDataManager.state.getSnapshot().customData;
                    return (
                        text !== '' ||
                        atts.length > 0 ||
                        !!poll ||
                        Object.keys(custom).length > 0
                    );
                },

                /* 2️⃣  Build the composition object that <MessageInput> expects */
                async compose() {
                    if (this.compositionIsEmpty) return undefined;

                    const text = this.textComposer.state.getSnapshot().text.trim();
                    const now = new Date().toISOString();
                    const localMessage: Message = {
                        id: `local-${Date.now()}`,
                        text,
                        user_id: channelRef.client.user.id!,
                        created_at: now,
                    };

                    /* sendOptions can stay empty for MVP */
                    return { localMessage, message: localMessage, sendOptions: {} };
                },

                /* 3️⃣  Called by useSubmitHandler (send-button / Enter) */
                async sendMessage(
                    _localMessage: Message,
                    message: Message,
                    _opts: unknown,
                ) {
                    /* optimistic echo already done in textComposer.submit() */
                    await channelRef.sendMessage({ text: message.text });
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
                    return () => { unsubs.forEach(fn => fn()); };
                },
                createDraft() {
                    const text = textStore.getSnapshot().text;
                    localStorage.setItem(getRoomKey(), text);
                    const token = channelRef.client['jwt'];
                    if (token) {
                        fetch(`/api/rooms/${channelRef.uuid}/draft/`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ text }),
                        }).catch(() => { /* ignore network errors */ });
                    }
                    logDraftUpdateTimestamp();
                },
                discardDraft() { localStorage.removeItem(getRoomKey()); logDraftUpdateTimestamp(); },

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

                /* ——— simple passthrough helpers ——— */
                getInputValue() { return textStore.getSnapshot().text; },
                setInputValue(v: string) { textStore._set({ text: v }); },
                reset() { this.textComposer.clear(); },

                /** Update quoted message for replies */
                setQuotedMessage(msg: Message | undefined) {
                    this.state._set({ quotedMessage: msg });
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
        this.cid = `messaging:${this.uuid}`;
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

    /** Human readable channel name if provided */
    get name() { return this.data.name; }

    /** Return the parent ChatClient instance */
    getClient() { return this.client; }
    async getConfig() {
        const res = await fetch(`${API.ROOMS}${this.uuid}/config/`, {
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('getConfig failed');
        return await res.json();
    }

    countUnread() {
        const me = this._state.read[this.client.user.id!];
        return me ? me.unread_messages : 0;
    }
    lastRead() {
        const me = this._state.read[this.client.user.id!];
        return me ? new Date(me.last_read) : undefined;
    }

    /** Fetch read states for this channel */
    async read() {
        const res = await fetch(`/api/rooms/${this.uuid}/read/`, {
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('read failed');
        const list = (await res.json()) as {
            user: string;
            last_read: string;
            unread_messages: number;
        }[];
        const map: Record<string, { last_read: string; unread_messages: number; user: { id: string } }> = {};
        for (const item of list) {
            map[item.user] = {
                last_read: item.last_read,
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
            const res = await fetch(`${API.ROOMS}${this.uuid}/messages/`, {
                headers: { Authorization: `Bearer ${this.client['jwt']}` },
            });
            if (res.ok) {
                const first: Message[] = await res.json();
                const me = this.client.user.id;
                if (me) {
                    this.bump({
                        messages: first,
                        latestMessages: first,
                        read: {
                            ...this._state.read,
                            [me]: {
                                last_read: new Date().toISOString(),
                                last_read_message_id: first.at(-1)?.id,
                                unread_messages: 0,
                            },
                        },
                    });
                } else {
                    this.bump({ messages: first, latestMessages: first });
                }
            }

            const memRes = await fetch(`${API.ROOMS}${this.uuid}/members/`, {
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
            const res = await fetch(`${API.ROOMS}${this.uuid}/messages/`, {
                headers: { Authorization: `Bearer ${this.client['jwt']}` },
            });
            if (res.ok) {
                const first: Message[] = await res.json();
                const me = this.client.user.id;
                if (!me) return;
                this.bump({
                    messages: first,
                    latestMessages: first,                   // 🔹 keep mirror
                    read: {
                        ...this._state.read,
                        [me]: {
                            last_read: new Date().toISOString(),
                            last_read_message_id: first.at(-1)?.id,
                            unread_messages: 0
                        }
                    },
                });
            }

            const memRes = await fetch(`${API.ROOMS}${this.uuid}/members/`, {
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
        this.socket = new WebSocket(
            `ws://localhost:8000/ws/${this.uuid}/?token=${this.client['jwt']}`,
        );
        this.socket.onmessage = (ev) => {
            try {
                const p = JSON.parse(ev.data);
                switch (p.type) {
                    case 'message': {
                        const msg = p.data as Message;
                        this.bump({
                            messages: [...this._state.messages, msg],
                            latestMessages: [...this._state.latestMessages.slice(-49), msg], // keep last 50
                        });
                        this.emitter.emit(EVENTS.MESSAGE_NEW, { type: EVENTS.MESSAGE_NEW, message: msg });
                        break;
                    }
                    case 'typing.start':
                    case 'typing.stop':
                        this.emitter.emit(p.type, { type: p.type, user_id: p.user_id } as any);
                        break;
                }
            } catch { console.error('bad WS', ev.data); }
        };
    }

    async markRead() {
        const me = this.client.user.id;
        const lastId = this._state.latestMessages.at(-1)?.id;
        if (me) {
            fetch(`/api/rooms/${this.uuid}/mark_read/`, {
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
                        last_read: new Date().toISOString(),
                        last_read_message_id: lastId,
                        unread_messages: 0,
                    },
                },
            });
        }
    }

    async markUnread() {
        const me = this.client.user.id;
        if (me) {
            fetch(`/api/rooms/${this.uuid}/mark_unread/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.client['jwt']}`,
                },
            }).catch(() => { /* network errors ignored */ });

            const { [me]: _removed, ...rest } = this._state.read;
            this.bump({ read: rest });
        }
    }


    /** Network-level send that also updates local state & fires EVENTS.MESSAGE_NEW */
    async sendMessage({ text }: { text: string }) {
        const custom = this.messageComposer.customDataManager.state.getSnapshot().customData;
        const poll = this.messageComposer.pollComposer.state.getSnapshot().poll;
        const payload: any = { text };
        if (Object.keys(custom).length) payload.custom_data = custom;
        if (poll) payload.poll = poll;
        const threadId = this.messageComposer.threadId;
        if (threadId) payload.reply_to = threadId;
        if (this.messageComposer.state.getSnapshot().showReplyInChannel) {
            payload.show_in_channel = true;
        }
        const res = await fetch(`${API.ROOMS}${this.uuid}/messages/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.client['jwt']}`,
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('sendMessage failed');

        const msg = await res.json() as Message;

        /* push to state */
        this.bump({
            messages: [...this._state.messages, msg],
            latestMessages: [...this._state.latestMessages.slice(-49), msg],
        });

        /* global bus notify */
        this.client.emit(EVENTS.MESSAGE_NEW, { message: msg });

        this.messageComposer.customDataManager.clear();
        this.messageComposer.pollComposer.state._set({ poll: undefined as any });

        return msg;
    }

    /** Delete a message by id */
    async deleteMessage(messageId: string) {
        const res = await fetch(`${API.MESSAGES}${messageId}/`, {
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

    /** Restore a previously deleted message */
    async restore(messageId: string) {
        const res = await fetch(`${API.MESSAGES}${messageId}/restore/`, {
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
        const res = await fetch(`${API.MESSAGES}${messageId}/reactions/`, {
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
        const res = await fetch(`${API.MESSAGES}${messageId}/actions/`, {
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
        const res = await fetch(`${API.MESSAGES}${messageId}/flag/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('flagMessage failed');
        return await res.json();
    }

    /** Pin a message */
    async pin(messageId: string) {
        const res = await fetch(`${API.MESSAGES}${messageId}/pin/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('pin failed');
    }

    /** Fetch pinned messages for this channel */
    async pinnedMessages() {
        const res = await fetch(`/api/rooms/${this.uuid}/pinned/`, {
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('pinnedMessages failed');
        const list = await res.json() as Message[];
        this.bump({ pinnedMessages: list });
        return list;
    }

    /** Fetch reactions for a given message */
    async queryReactions(messageId: string) {
        const res = await fetch(`${API.MESSAGES}${messageId}/reactions/`, {
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('queryReactions failed');
        return await res.json() as any[];
    }
    /** Delete a reaction */
    async deleteReaction(messageId: string, reactionId: string) {
        const res = await fetch(`${API.MESSAGES}${messageId}/reactions/${reactionId}/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('deleteReaction failed');

    }

    /** Fetch replies to a given message */
    async getReplies(messageId: string) {
        const res = await fetch(`${API.MESSAGES}${messageId}/replies/`, {
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('getReplies failed');
        return await res.json() as Message[];
    }

    /** Archive this channel */
    async archive() {
        const res = await fetch(`/api/rooms/${this.uuid}/archive/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('archive failed');
    }

    /** Unarchive this channel */
    async unarchive() {
        const res = await fetch(`/api/rooms/${this.uuid}/unarchive/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('unarchive failed');
    }

    /** Hide this channel */
    async hide() {
        const res = await fetch(`/api/rooms/${this.uuid}/hide/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('hide failed');
        this.data.hidden = true;
    }

    /** Show this channel */
    async show() {
        const res = await fetch(`/api/rooms/${this.uuid}/show/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.client['jwt']}` },
        });
        if (!res.ok) throw new Error('show failed');
        this.data.hidden = false;
    }

    /** Fetch cooldown value for this channel */
    async cooldown() {
        const res = await fetch(`${API.COOLDOWN}${this.uuid}/cooldown/`, {
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
                    this.bump({
                        messages: [...this._state.messages, event.message],
                        latestMessages: [...this._state.latestMessages.slice(-49), event.message],
                    });
                }
                this.emitter.emit(EVENTS.MESSAGE_NEW, event as any);
                break;
            case 'typing.start':
            case 'typing.stop':
                this.emitter.emit(event.type as any, event as any);
                break;
            default:
                this.emitter.emit(event.type as any, event as any);
        }
    }

    /* internal: mutate + notify React */
    /* tiny helper that mutates state *and* notifies both stores */
    private bump(patch: Partial<typeof this._state>) {
        this._state = { ...this._state, ...patch };
        this.stateStore._set(patch);     // ← keep channel store current
        this.client.stateStore._set({}); // ← nudge parent Chat to re-render
    }
}