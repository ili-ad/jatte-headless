"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
var mitt_1 = require("mitt");
var MiniStore_1 = require("./MiniStore");
var constants_1 = require("./constants");
var api_1 = require("../api");
var errors_1 = require("../errors");
var attachments_1 = require("./composer/attachments");
/* ──────────────────────────────────────────────────────────────── */
/*  CustomChannel  –  minimal Stream-Chat look-alike               */
/* ──────────────────────────────────────────────────────────────── */
var Channel = /** @class */ (function () {
    function Channel(id, uuid, roomName, client, extraData) {
        if (extraData === void 0) { extraData = {}; }
        var _this = this;
        this.client = client;
        this.emitter = (0, mitt_1.default)();
        /* channel-local state object */
        this._state = {
            messages: [],
            latestMessages: [],
            messagePagination: { hasPrev: false, hasNext: false },
            pinnedMessages: [],
            read: {},
            members: {},
            /* stub so <MessageInput> works */
            /* stub so <MessageInput> works */
            /* ──────────────── messageComposer shim ──────────────── */
            messageComposer: (function () {
                var channelRef = _this; // capture parent
                var registered = false;
                var getRoomKey = function () { return "draft:".concat(channelRef.uuid); };
                /* load any previously‑saved draft */
                var loadDraft = function () {
                    var _a;
                    try {
                        return (_a = localStorage.getItem(getRoomKey())) !== null && _a !== void 0 ? _a : '';
                    }
                    catch (_b) {
                        return '';
                    }
                };
                /* tiny reactive store for the text composer */
                var textStore = new MiniStore_1.MiniStore({
                    text: loadDraft(),
                    selection: { start: 0, end: 0 },
                    suggestions: {
                        searchSource: { state: new MiniStore_1.MiniStore({ isLoadingItems: false }) },
                    },
                });
                /* track timestamps for edits/drafts */
                var editingAuditState = new MiniStore_1.MiniStore({
                    lastChange: {
                        draftUpdate: null,
                        stateUpdate: Date.now(),
                    },
                });
                var logStateUpdateTimestamp = function () {
                    var last = editingAuditState.getSnapshot().lastChange;
                    editingAuditState._set({
                        lastChange: __assign(__assign({}, last), { stateUpdate: Date.now() }),
                    });
                };
                var logDraftUpdateTimestamp = function () {
                    var ts = Date.now();
                    editingAuditState._set({
                        lastChange: { draftUpdate: ts, stateUpdate: ts },
                    });
                };
                return {
                    contextType: 'message',
                    tag: 'root',
                    /* ——— attachment manager ——— */
                    attachmentManager: (0, attachments_1.buildAttachmentManager)({ jwt: channelRef.client['jwt'] }),
                    /* ——— composer‑level stores ——— */
                    state: new MiniStore_1.MiniStore({
                        quotedMessage: undefined,
                        showReplyInChannel: false,
                    }),
                    editingAuditState: editingAuditState,
                    linkPreviewsManager: (function () {
                        var store = new MiniStore_1.MiniStore({ previews: [] });
                        return {
                            state: store,
                            add: function (url) {
                                return __awaiter(this, void 0, void 0, function () {
                                    var res, preview, list;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.LINK_PREVIEW, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        Authorization: "Bearer ".concat(channelRef.client['jwt']),
                                                    },
                                                    body: JSON.stringify({ url: url }),
                                                })];
                                            case 1:
                                                res = _a.sent();
                                                if (!res.ok) return [3 /*break*/, 3];
                                                return [4 /*yield*/, res.json()];
                                            case 2:
                                                preview = _a.sent();
                                                list = store.getSnapshot().previews;
                                                store._set({ previews: __spreadArray(__spreadArray([], list, true), [preview], false) });
                                                _a.label = 3;
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            remove: function (url) {
                                var list = store.getSnapshot().previews;
                                store._set({ previews: list.filter(function (p) { return p.url !== url; }) });
                            },
                            clear: function () {
                                store._set({ previews: [] });
                            },
                        };
                    })(),
                    pollComposer: {
                        state: new MiniStore_1.MiniStore({
                            poll: undefined,
                        }),
                        create: function (question_1) {
                            return __awaiter(this, arguments, void 0, function (question, options) {
                                var res, data;
                                if (options === void 0) { options = []; }
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.POLLS, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    Authorization: "Bearer ".concat(channelRef.client['jwt']),
                                                },
                                                body: JSON.stringify({ question: question, options: options }),
                                            })];
                                        case 1:
                                            res = _a.sent();
                                            if (!res.ok) return [3 /*break*/, 3];
                                            return [4 /*yield*/, res.json()];
                                        case 2:
                                            data = _a.sent();
                                            this.state._set({ poll: data.poll });
                                            _a.label = 3;
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            });
                        },
                        remove: function () {
                            return __awaiter(this, void 0, void 0, function () {
                                var poll;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            poll = this.state.getSnapshot().poll;
                                            if (!poll)
                                                return [2 /*return*/];
                                            return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.POLLS).concat(poll.id, "/"), {
                                                    method: 'DELETE',
                                                    headers: {
                                                        Authorization: "Bearer ".concat(channelRef.client['jwt']),
                                                    },
                                                }).catch(function () { })];
                                        case 1:
                                            _a.sent();
                                            this.state._set({ poll: undefined });
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        },
                        reset: function () {
                            this.state._set({ poll: undefined });
                        },
                    },
                    customDataManager: {
                        state: new MiniStore_1.MiniStore({
                            customData: {},
                        }),
                        set: function (k, v) {
                            var _a;
                            var current = this.state.getSnapshot().customData;
                            this.state._set({ customData: __assign(__assign({}, current), (_a = {}, _a[k] = v, _a)) });
                        },
                        clear: function () { this.state._set({ customData: {} }); },
                    },
                    logStateUpdateTimestamp: logStateUpdateTimestamp,
                    logDraftUpdateTimestamp: logDraftUpdateTimestamp,
                    sendEditingAuditState: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var token, _a, draftUpdate, stateUpdate;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        token = channelRef.client['jwt'];
                                        if (!token)
                                            return [2 /*return*/];
                                        _a = editingAuditState.getSnapshot().lastChange, draftUpdate = _a.draftUpdate, stateUpdate = _a.stateUpdate;
                                        return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.EDITING_AUDIT_STATE, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    Authorization: "Bearer ".concat(token),
                                                },
                                                body: JSON.stringify({ draft_update: draftUpdate, state_update: stateUpdate }),
                                            }).catch(function () { })];
                                    case 1:
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    },
                    /* ------------- text‑composer impl ------------------- */
                    textComposer: {
                        state: textStore,
                        /* update helpers React calls */
                        setText: function (text) { textStore._set({ text: text }); logStateUpdateTimestamp(); },
                        setSelection: function (sel) { textStore._set({ selection: sel }); },
                        clear: function () { textStore._set({ text: '', selection: { start: 0, end: 0 } }); logStateUpdateTimestamp(); },
                        handleChange: function (_a) {
                            var text = _a.text, selection = _a.selection;
                            textStore._set({ text: text, selection: selection });
                            logStateUpdateTimestamp();
                        },
                        handleKeyEvent: function (evt) {
                            if (evt.key === 'Enter' && !evt.shiftKey) {
                                evt.preventDefault();
                                this.submit();
                            }
                        },
                        /** ⇢ ACTUAL send logic */
                        submit: function () {
                            return __awaiter(this, void 0, void 0, function () {
                                var draft, userId, localMsg;
                                var _a;
                                return __generator(this, function (_b) {
                                    draft = textStore.getSnapshot().text.trim();
                                    userId = (_a = channelRef.client.user) === null || _a === void 0 ? void 0 : _a.id;
                                    if (!draft || !userId)
                                        return [2 /*return*/];
                                    localMsg = {
                                        id: "local-".concat(Date.now()),
                                        text: draft,
                                        user_id: userId,
                                        created_at: new Date().toISOString(),
                                    };
                                    channelRef.bump({
                                        messages: __spreadArray(__spreadArray([], channelRef.state.messages, true), [localMsg], false),
                                        latestMessages: __spreadArray(__spreadArray([], channelRef.state.latestMessages.slice(-49), true), [localMsg], false),
                                    });
                                    channelRef.emitter.emit(constants_1.EVENTS.MESSAGE_NEW, { type: constants_1.EVENTS.MESSAGE_NEW, message: localMsg });
                                    /* 🔸 fire the real network request (no await needed for UX) */
                                    channelRef.sendMessage({ text: draft })
                                        .catch(console.error);
                                    /* clear draft + saved localStorage copy */
                                    this.clear();
                                    localStorage.removeItem(getRoomKey());
                                    return [2 /*return*/];
                                });
                            });
                        },
                    }, /* ← end of textComposer */
                    /* -----  place INSIDE  messageComposer: { … }  ----- */
                    /* 1️⃣  Is there anything to send? */
                    get compositionIsEmpty() {
                        return this.textComposer.state.getSnapshot().text.trim() === '';
                    },
                    /* 2️⃣  Check if any payload (text, attachment, poll, custom) is present */
                    get hasSendableData() {
                        var text = this.textComposer.state.getSnapshot().text.trim();
                        var atts = this.attachmentManager.state.getSnapshot().attachments;
                        var poll = this.pollComposer.state.getSnapshot().poll;
                        var custom = this.customDataManager.state.getSnapshot().customData;
                        return (text !== '' ||
                            atts.length > 0 ||
                            !!poll ||
                            Object.keys(custom).length > 0);
                    },
                    /* 2️⃣  Build the composition object that <MessageInput> expects */
                    compose: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var userId, text, now, localMessage;
                            var _a;
                            return __generator(this, function (_b) {
                                if (this.compositionIsEmpty)
                                    return [2 /*return*/, undefined];
                                userId = (_a = channelRef.client.user) === null || _a === void 0 ? void 0 : _a.id;
                                if (!userId)
                                    return [2 /*return*/, undefined];
                                text = this.textComposer.state.getSnapshot().text.trim();
                                now = new Date().toISOString();
                                localMessage = {
                                    id: "local-".concat(Date.now()),
                                    text: text,
                                    user_id: userId,
                                    created_at: now,
                                };
                                /* sendOptions can stay empty for MVP */
                                return [2 /*return*/, { localMessage: localMessage, message: localMessage, sendOptions: {} }];
                            });
                        });
                    },
                    /* 3️⃣  Called by useSubmitHandler (send-button / Enter) */
                    sendMessage: function (_localMessage, message, _opts) {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: 
                                    /* optimistic echo already done in textComposer.submit() */
                                    return [4 /*yield*/, channelRef.sendMessage({ text: message.text })];
                                    case 1:
                                        /* optimistic echo already done in textComposer.submit() */
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    },
                    /* ------------- expose submit for <MessageInput> ------ */
                    submit: function () {
                        this.textComposer.submit();
                    },
                    /* ——— subscriptions & drafts ——— */
                    registerSubscriptions: function () {
                        var handler = this.logStateUpdateTimestamp;
                        var unsubs = [
                            textStore.subscribe(handler),
                            this.attachmentManager.state.subscribe(handler),
                            this.linkPreviewsManager.state.subscribe(handler),
                            this.pollComposer.state.subscribe(handler),
                            this.customDataManager.state.subscribe(handler),
                        ];
                        var token = channelRef.client['jwt'];
                        if (token && !registered) {
                            registered = true;
                            (0, api_1.apiFetch)(constants_1.API.REGISTER_SUBSCRIPTIONS, {
                                method: 'POST',
                                headers: { Authorization: "Bearer ".concat(token) },
                            }).catch(function () { });
                        }
                        return function () { unsubs.forEach(function (fn) { return fn(); }); };
                    },
                    createDraft: function () {
                        var text = textStore.getSnapshot().text;
                        localStorage.setItem(getRoomKey(), text);
                        var token = channelRef.client['jwt'];
                        if (token) {
                            (0, api_1.apiFetch)("/rooms/".concat(channelRef.uuid, "/draft/"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: "Bearer ".concat(token),
                                },
                                body: JSON.stringify({ text: text }),
                            }).catch(function () { });
                        }
                        logDraftUpdateTimestamp();
                        this.sendEditingAuditState();
                    },
                    discardDraft: function () {
                        localStorage.removeItem(getRoomKey());
                        logDraftUpdateTimestamp();
                        this.sendEditingAuditState();
                    },
                    /** Current draft text */
                    get draft() { return textStore.getSnapshot().text; },
                    set draft(v) { textStore._set({ text: v }); },
                    /** Fetch draft from the backend and sync local state */
                    getDraft: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var token, res, data, text;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        token = channelRef.client['jwt'];
                                        if (!token)
                                            return [2 /*return*/, ''];
                                        return [4 /*yield*/, (0, api_1.apiFetch)("/rooms/".concat(channelRef.uuid, "/draft/"), {
                                                headers: { Authorization: "Bearer ".concat(token) },
                                            })];
                                    case 1:
                                        res = _a.sent();
                                        if (!res.ok)
                                            throw new Error('getDraft failed');
                                        return [4 /*yield*/, res.json().catch(function () { return ({ text: '' }); })];
                                    case 2:
                                        data = _a.sent();
                                        text = typeof data.text === 'string' ? data.text : '';
                                        textStore._set({ text: text });
                                        return [2 /*return*/, text];
                                }
                            });
                        });
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
                    configState: new MiniStore_1.MiniStore({
                        attachments: {
                            acceptedFiles: [],
                            maxNumberOfFilesPerMessage: 10,
                        },
                        text: { enabled: true },
                        multipleUploads: true,
                        isUploadEnabled: true,
                    }),
                    get config() { return this.configState.getLatestValue(); },
                    getConfigState: function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var token, res, data;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        token = channelRef.client["jwt"];
                                        return [4 /*yield*/, (0, api_1.apiFetch)("/rooms/".concat(channelRef.uuid, "/config-state"), {
                                                headers: { Authorization: "Bearer ".concat(token) },
                                            })];
                                    case 1:
                                        res = _a.sent();
                                        if (!res.ok)
                                            throw new Error("getConfigState failed");
                                        return [4 /*yield*/, res.json().catch(function () { return ({}); })];
                                    case 2:
                                        data = _a.sent();
                                        this.configState._set(data);
                                        return [2 /*return*/, this.configState.getLatestValue()];
                                }
                            });
                        });
                    },
                    /* ——— simple passthrough helpers ——— */
                    getInputValue: function () { return textStore.getSnapshot().text; },
                    setInputValue: function (v) { textStore._set({ text: v }); },
                    reset: function () { this.textComposer.clear(); },
                    /** Update quoted message for replies */
                    setQuotedMessage: function (msg) {
                        this.state._set({ quotedMessage: msg });
                        var token = channelRef.client['jwt'];
                        if (token) {
                            (0, api_1.apiFetch)(constants_1.API.QUOTED_MESSAGE, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: "Bearer ".concat(token),
                                },
                                body: JSON.stringify({ quoted_message: msg !== null && msg !== void 0 ? msg : null }),
                            }).catch(function () { });
                        }
                    },
                    /** Currently edited message, if any */
                    editedMessage: undefined,
                    /** Parent message id for thread replies */
                    threadId: undefined,
                    /** Set the message being edited and sync text composer */
                    setEditedMessage: function (msg) {
                        this.editedMessage = msg;
                        var text = msg ? msg.text : '';
                        textStore._set({ text: text });
                    },
                    /** Set the current thread id */
                    setThreadId: function (id) {
                        this.threadId = id;
                    },
                    /** Toggle whether replies are shown in-channel */
                    toggleShowReplyInChannel: function () {
                        var cur = this.state.getSnapshot().showReplyInChannel;
                        this.state._set({ showReplyInChannel: !cur });
                    },
                    /** Current flag for showing replies in-channel */
                    get showReplyInChannel() {
                        return this.state.getSnapshot().showReplyInChannel;
                    },
                    /** Reset composer state optionally from an existing message */
                    initState: function (_a) {
                        var _b = _a === void 0 ? {} : _a, composition = _b.composition;
                        this.attachmentManager.state._set({ attachments: [] });
                        this.linkPreviewsManager.state._set({ previews: [] });
                        this.pollComposer.state._set({ poll: undefined });
                        this.customDataManager.clear();
                        this.state._set({ quotedMessage: undefined });
                        this.editingAuditState._set({
                            lastChange: { draftUpdate: null, stateUpdate: Date.now() },
                        });
                        this.textComposer.clear();
                        if (composition) {
                            this.setEditedMessage(composition);
                        }
                        else {
                            this.setEditedMessage(undefined);
                        }
                    },
                    /** Clear composer state and discard any stored draft */
                    clear: function () {
                        this.initState();
                        var token = channelRef.client['jwt'];
                        if (token) {
                            (0, api_1.apiFetch)("/rooms/".concat(channelRef.uuid, "/draft/"), {
                                method: 'DELETE',
                                headers: { Authorization: "Bearer ".concat(token) },
                            }).catch(function () { });
                        }
                    },
                };
            })(), // end of IIFE
        }; // ←———————— END of _state object
        /** 🔹 expose the same object on the channel itself */
        this.messageComposer = this._state.messageComposer;
        /** Stream-UI pulls from here via `useStateStore` */
        this.stateStore = new MiniStore_1.MiniStore(this._state);
        this.initialized = false;
        /* event helpers */
        this.on = this.emitter.on;
        this.off = this.emitter.off;
        this.id = id;
        this.uuid = uuid;
        this.roomUuid = uuid;
        this.type = 'messaging';
        this.cid = "".concat(this.type, ":").concat(this.uuid);
        this.data = __assign({ name: roomName }, extraData);
    }
    Object.defineProperty(Channel.prototype, "state", {
        /* ─── getters Stream-UI expects ─── */
        get: function () { return this._state; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Channel.prototype, "messages", {
        /** Convenience getter exposing current message list */
        get: function () { return this._state.messages; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Channel.prototype, "members", {
        /** Return current members map */
        get: function () { return this._state.members; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Channel.prototype, "hidden", {
        /** Whether this channel is hidden */
        get: function () { return !!this.data.hidden; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Channel.prototype, "visible", {
        /** Whether this channel is visible */
        get: function () { return !this.hidden; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Channel.prototype, "truncated", {
        /** Whether this channel has been truncated */
        get: function () { return !!this.data.truncated; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Channel.prototype, "name", {
        /** Human readable channel name if provided */
        get: function () { return this.data.name; },
        enumerable: false,
        configurable: true
    });
    /** Return the parent ChatClient instance */
    Channel.prototype.getClient = function () { return this.client; };
    Channel.prototype.getConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.ROOMS).concat(this.cid, "/config/"), {
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (res.status === 403)
                            throw new errors_1.AuthError('Unauthenticated');
                        if (!res.ok)
                            throw new Error('getConfig failed');
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Channel.prototype.countUnread = function () {
        var _a;
        var userId = (_a = this.client.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return 0;
        var me = this._state.read[userId];
        return me ? me.unread_messages : 0;
    };
    Channel.prototype.lastRead = function () {
        var _a;
        var userId = (_a = this.client.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return undefined;
        var me = this._state.read[userId];
        return me ? new Date(me.last_read) : undefined;
    };
    /** Fetch read states for this channel */
    Channel.prototype.read = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, list, map, _i, list_1, item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("/rooms/".concat(this.uuid, "/read"), {
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('read failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        list = (_a.sent());
                        map = {};
                        for (_i = 0, list_1 = list; _i < list_1.length; _i++) {
                            item = list_1[_i];
                            map[item.user] = {
                                last_read: item.last_read,
                                unread_messages: item.unread_messages,
                                user: { id: item.user },
                            };
                        }
                        this.bump({ read: map });
                        return [2 /*return*/, map];
                }
            });
        });
    };
    /* ─── main lifecycle ─── */
    /** Fetch initial state without opening a websocket */
    Channel.prototype.query = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, first, me, memRes, list, map, _i, list_2, m, _a;
            var _b;
            var _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.ROOMS).concat(this.cid, "/messages/"), {
                                headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                            })];
                    case 1:
                        res = _e.sent();
                        if (!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        first = _e.sent();
                        me = (_c = this.client.user) === null || _c === void 0 ? void 0 : _c.id;
                        if (me) {
                            this.bump({
                                messages: first,
                                latestMessages: first,
                                read: __assign(__assign({}, this._state.read), (_b = {}, _b[me] = {
                                    last_read: new Date().toISOString(),
                                    last_read_message_id: (_d = first.at(-1)) === null || _d === void 0 ? void 0 : _d.id,
                                    unread_messages: 0,
                                }, _b)),
                            });
                        }
                        else {
                            this.bump({ messages: first, latestMessages: first });
                        }
                        _e.label = 3;
                    case 3: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.ROOMS).concat(this.cid, "/members/"), {
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 4:
                        memRes = _e.sent();
                        if (!memRes.ok) return [3 /*break*/, 6];
                        return [4 /*yield*/, memRes.json()];
                    case 5:
                        list = (_e.sent());
                        map = {};
                        for (_i = 0, list_2 = list; _i < list_2.length; _i++) {
                            m = list_2[_i];
                            map[m.id] = { user: { id: m.id } };
                        }
                        this.bump({ members: map });
                        _e.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        _a = _e.sent();
                        return [3 /*break*/, 8];
                    case 8:
                        this.initialized = true;
                        return [2 /*return*/];
                }
            });
        });
    };
    Channel.prototype.watch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, first, me, memRes, list, map, _i, list_3, m, _a, wsRoot;
            var _b;
            var _this = this;
            var _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (this.socket)
                            return [2 /*return*/];
                        this.client.activeChannels[this.cid] = this;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.ROOMS).concat(this.cid, "/messages/"), {
                                headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                            })];
                    case 2:
                        res = _e.sent();
                        if (!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.json()];
                    case 3:
                        first = _e.sent();
                        me = (_c = this.client.user) === null || _c === void 0 ? void 0 : _c.id;
                        if (!me)
                            return [2 /*return*/];
                        this.bump({
                            messages: first,
                            latestMessages: first, // 🔹 keep mirror
                            read: __assign(__assign({}, this._state.read), (_b = {}, _b[me] = {
                                last_read: new Date().toISOString(),
                                last_read_message_id: (_d = first.at(-1)) === null || _d === void 0 ? void 0 : _d.id,
                                unread_messages: 0
                            }, _b)),
                        });
                        _e.label = 4;
                    case 4: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.ROOMS).concat(this.cid, "/members/"), {
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 5:
                        memRes = _e.sent();
                        if (!memRes.ok) return [3 /*break*/, 7];
                        return [4 /*yield*/, memRes.json()];
                    case 6:
                        list = _e.sent();
                        map = {};
                        for (_i = 0, list_3 = list; _i < list_3.length; _i++) {
                            m = list_3[_i];
                            map[m.id] = { user: { id: m.id } };
                        }
                        this.bump({ members: map });
                        _e.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        _a = _e.sent();
                        return [3 /*break*/, 9];
                    case 9:
                        this.initialized = true;
                        wsRoot = process.env.NEXT_PUBLIC_WS_URL;
                        if (!wsRoot) {
                            throw new Error('NEXT_PUBLIC_WS_URL is not set');
                        }
                        this.socket = new WebSocket("".concat(wsRoot, "/ws/").concat(this.cid, "/?token=").concat(this.client['jwt']));
                        this.socket.onmessage = function (ev) {
                            try {
                                var p = JSON.parse(ev.data);
                                switch (p.type) {
                                    case 'message': {
                                        var msg = p.data;
                                        _this.bump({
                                            messages: __spreadArray(__spreadArray([], _this._state.messages, true), [msg], false),
                                            latestMessages: __spreadArray(__spreadArray([], _this._state.latestMessages.slice(-49), true), [msg], false), // keep last 50
                                        });
                                        _this.emitter.emit(constants_1.EVENTS.MESSAGE_NEW, { type: constants_1.EVENTS.MESSAGE_NEW, message: msg });
                                        break;
                                    }
                                    case 'typing.start':
                                    case 'typing.stop':
                                        _this.emitter.emit(p.type, { type: p.type, user_id: p.user_id });
                                        break;
                                }
                            }
                            catch (_a) {
                                console.error('bad WS', ev.data);
                            }
                        };
                        return [2 /*return*/];
                }
            });
        });
    };
    Channel.prototype.markRead = function () {
        return __awaiter(this, void 0, void 0, function () {
            var me, lastId;
            var _a;
            var _b, _c;
            return __generator(this, function (_d) {
                me = (_b = this.client.user) === null || _b === void 0 ? void 0 : _b.id;
                lastId = (_c = this._state.latestMessages.at(-1)) === null || _c === void 0 ? void 0 : _c.id;
                if (me) {
                    (0, api_1.apiFetch)("/rooms/".concat(this.uuid, "/mark_read"), {
                        method: 'POST',
                        headers: {
                            Authorization: "Bearer ".concat(this.client['jwt']),
                        },
                    }).catch(function () { });
                }
                if (me) {
                    this.bump({
                        read: __assign(__assign({}, this._state.read), (_a = {}, _a[me] = {
                            last_read: new Date().toISOString(),
                            last_read_message_id: lastId,
                            unread_messages: 0,
                        }, _a)),
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    Channel.prototype.markUnread = function () {
        return __awaiter(this, void 0, void 0, function () {
            var me, _a, _b, _removed, rest;
            var _c;
            return __generator(this, function (_d) {
                me = (_c = this.client.user) === null || _c === void 0 ? void 0 : _c.id;
                if (me) {
                    (0, api_1.apiFetch)("/rooms/".concat(this.uuid, "/mark_unread"), {
                        method: 'POST',
                        headers: {
                            Authorization: "Bearer ".concat(this.client['jwt']),
                        },
                    }).catch(function () { });
                    _a = this._state.read, _b = me, _removed = _a[_b], rest = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
                    this.bump({ read: rest });
                }
                return [2 /*return*/];
            });
        });
    };
    /** Network-level send that also updates local state & fires EVENTS.MESSAGE_NEW */
    Channel.prototype.sendMessage = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var custom, poll, payload, threadId, res, msg;
            var text = _b.text;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        custom = this.messageComposer.customDataManager.state.getSnapshot().customData;
                        poll = this.messageComposer.pollComposer.state.getSnapshot().poll;
                        payload = { text: text };
                        if (Object.keys(custom).length)
                            payload.custom_data = custom;
                        if (poll)
                            payload.poll = poll;
                        threadId = this.messageComposer.threadId;
                        if (threadId)
                            payload.reply_to = threadId;
                        if (this.messageComposer.state.getSnapshot().showReplyInChannel) {
                            payload.show_in_channel = true;
                        }
                        return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.ROOMS).concat(this.cid, "/messages/"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: "Bearer ".concat(this.client['jwt']),
                                },
                                body: JSON.stringify(payload),
                            })];
                    case 1:
                        res = _c.sent();
                        if (!res.ok)
                            throw new Error('sendMessage failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        msg = _c.sent();
                        /* push to state */
                        this.bump({
                            messages: __spreadArray(__spreadArray([], this._state.messages, true), [msg], false),
                            latestMessages: __spreadArray(__spreadArray([], this._state.latestMessages.slice(-49), true), [msg], false),
                        });
                        /* global bus notify */
                        this.client.emit(constants_1.EVENTS.MESSAGE_NEW, { message: msg });
                        this.messageComposer.customDataManager.clear();
                        this.messageComposer.pollComposer.state._set({ poll: undefined });
                        return [2 /*return*/, msg];
                }
            });
        });
    };
    /** Delete a message by id */
    Channel.prototype.deleteMessage = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var res, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MESSAGES).concat(messageId, "/"), {
                            method: 'DELETE',
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('deleteMessage failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        updated = _a.sent();
                        this.bump({
                            messages: this._state.messages.map(function (m) { return m.id === messageId ? updated : m; }),
                            latestMessages: this._state.latestMessages.map(function (m) { return m.id === messageId ? updated : m; }),
                        });
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    /** Update a message's text */
    Channel.prototype.updateMessage = function (messageId, text) {
        return __awaiter(this, void 0, void 0, function () {
            var res, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MESSAGES).concat(messageId, "/"), {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: "Bearer ".concat(this.client['jwt']),
                            },
                            body: JSON.stringify({ text: text }),
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('updateMessage failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        updated = _a.sent();
                        this.bump({
                            messages: this._state.messages.map(function (m) { return m.id === messageId ? updated : m; }),
                            latestMessages: this._state.latestMessages.map(function (m) { return m.id === messageId ? updated : m; }),
                        });
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    /** Fetch a single message by id and update local state */
    Channel.prototype.editedMessage = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var res, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MESSAGES).concat(messageId, "/"), {
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('editedMessage failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        msg = _a.sent();
                        this.bump({
                            messages: this._state.messages.map(function (m) { return m.id === messageId ? msg : m; }),
                            latestMessages: this._state.latestMessages.map(function (m) { return m.id === messageId ? msg : m; }),
                        });
                        return [2 /*return*/, msg];
                }
            });
        });
    };
    /** Restore a previously deleted message */
    Channel.prototype.restore = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var res, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MESSAGES).concat(messageId, "/restore/"), {
                            method: 'POST',
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('restore failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        updated = _a.sent();
                        this.bump({
                            messages: this._state.messages.map(function (m) { return m.id === messageId ? updated : m; }),
                            latestMessages: this._state.latestMessages.map(function (m) { return m.id === messageId ? updated : m; }),
                        });
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    /** Send a reaction to a message */
    Channel.prototype.sendReaction = function (messageId, type) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MESSAGES).concat(messageId, "/reactions/"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: "Bearer ".concat(this.client['jwt']),
                            },
                            body: JSON.stringify({ type: type }),
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('sendReaction failed');
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /** Send an action for a message */
    Channel.prototype.sendAction = function (messageId, action) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MESSAGES).concat(messageId, "/actions/"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: "Bearer ".concat(this.client['jwt']),
                            },
                            body: JSON.stringify(action),
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('sendAction failed');
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /** Flag a message for moderation */
    Channel.prototype.flagMessage = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MESSAGES).concat(messageId, "/flag/"), {
                            method: 'POST',
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('flagMessage failed');
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /** Pin a message */
    Channel.prototype.pin = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MESSAGES).concat(messageId, "/pin/"), {
                            method: 'POST',
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('pin failed');
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Unpin a message */
    Channel.prototype.unpin = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MESSAGES).concat(messageId, "/unpin/"), {
                            method: 'DELETE',
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('unpin failed');
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Fetch pinned messages for this channel */
    Channel.prototype.pinnedMessages = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, list;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("/rooms/".concat(this.uuid, "/pinned"), {
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('pinnedMessages failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        list = _a.sent();
                        this.bump({ pinnedMessages: list });
                        return [2 /*return*/, list];
                }
            });
        });
    };
    /** Fetch reactions for a given message */
    Channel.prototype.queryReactions = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MESSAGES).concat(messageId, "/reactions/"), {
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('queryReactions failed');
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /** Delete a reaction */
    Channel.prototype.deleteReaction = function (messageId, reactionId) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MESSAGES).concat(messageId, "/reactions/").concat(reactionId, "/"), {
                            method: 'DELETE',
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('deleteReaction failed');
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Fetch replies to a given message */
    Channel.prototype.getReplies = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MESSAGES).concat(messageId, "/replies/"), {
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('getReplies failed');
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /** Archive this channel */
    Channel.prototype.archive = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("/rooms/".concat(this.uuid, "/archive"), {
                            method: 'POST',
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('archive failed');
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Unarchive this channel */
    Channel.prototype.unarchive = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("/rooms/".concat(this.uuid, "/unarchive"), {
                            method: 'POST',
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('unarchive failed');
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Hide this channel */
    Channel.prototype.hide = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("/rooms/".concat(this.uuid, "/hide"), {
                            method: 'POST',
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('hide failed');
                        this.data.hidden = true;
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Show this channel */
    Channel.prototype.show = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("/rooms/".concat(this.uuid, "/show"), {
                            method: 'POST',
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('show failed');
                        this.data.hidden = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Remove all messages from this channel */
    Channel.prototype.truncate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("/rooms/".concat(this.uuid, "/truncate/"), {
                            method: 'POST',
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('truncate failed');
                        this.bump({ messages: [], latestMessages: [] });
                        this.data.truncated = true;
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Fetch cooldown value for this channel */
    Channel.prototype.cooldown = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.COOLDOWN).concat(this.uuid, "/cooldown/"), {
                            headers: { Authorization: "Bearer ".concat(this.client['jwt']) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('cooldown failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data.cooldown];
                }
            });
        });
    };
    /**
     * Dispatch an incoming event to this channel.
     * Supports message.new and typing events.
     */
    Channel.prototype.dispatchEvent = function (event) {
        switch (event.type) {
            case constants_1.EVENTS.MESSAGE_NEW:
                if (event.message) {
                    this.bump({
                        messages: __spreadArray(__spreadArray([], this._state.messages, true), [event.message], false),
                        latestMessages: __spreadArray(__spreadArray([], this._state.latestMessages.slice(-49), true), [event.message], false),
                    });
                }
                this.emitter.emit(constants_1.EVENTS.MESSAGE_NEW, event);
                break;
            case 'typing.start':
            case 'typing.stop':
                this.emitter.emit(event.type, event);
                break;
            default:
                this.emitter.emit(event.type, event);
        }
    };
    /* internal: mutate + notify React */
    /* tiny helper that mutates state *and* notifies both stores */
    Channel.prototype.bump = function (patch) {
        this._state = __assign(__assign({}, this._state), patch);
        this.stateStore._set(patch); // ← keep channel store current
        this.client.stateStore._set({}); // ← nudge parent Chat to re-render
    };
    return Channel;
}());
exports.Channel = Channel;
