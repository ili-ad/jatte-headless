// libs/chat-shim/index.ts
"use client";
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.SearchController = exports.UserSearchSource = exports.MessageSearchSource = exports.ChannelSearchSource = exports.BaseSearchSource = exports.SearchSourceType = exports.StateStore = exports.ReminderManager = exports.isVoteAnswer = exports.VotingVisibility = exports.MessageComposer = exports.isAudioAttachment = exports.isVideoAttachment = exports.isImageAttachment = exports.isLocalFileAttachment = exports.isLocalVoiceRecordingAttachment = exports.isLocalAudioAttachment = exports.isLocalVideoAttachment = exports.isLocalImageAttachment = exports.isLocalUploadAttachment = exports.isLocalAttachment = exports.isVoiceRecordingAttachment = exports.getLocalClient = exports.StreamChat = exports.LinkPreviewsManager = exports.LinkPreviewStatus = exports.LocalChatClient = exports.LocalChannel = exports.ChannelState = exports.FixedSizeQueueCache = void 0;
exports.formatMessage = formatMessage;
exports.localMessageToNewMessagePayload = localMessageToNewMessagePayload;
exports.isScrapedContent = isScrapedContent;
exports.isFileAttachment = isFileAttachment;
exports.getTriggerCharWithToken = getTriggerCharWithToken;
exports.insertItemWithTrigger = insertItemWithTrigger;
exports.replaceWordWithEntity = replaceWordWithEntity;
exports.useStateStore = useStateStore;
var react_1 = require("react");
/* ------------------------------------------------------------------ */
/*  Minimal Fixed‑Size FIFO cache Stream‑UI expects                    */
/* ------------------------------------------------------------------ */
var FixedSizeQueueCache = /** @class */ (function () {
    function FixedSizeQueueCache(limit) {
        if (limit === void 0) { limit = 200; }
        this.limit = limit;
        this.buffer = [];
    }
    /** canonical method */
    FixedSizeQueueCache.prototype.push = function (item) {
        this.buffer.push(item);
        if (this.buffer.length > this.limit)
            this.buffer.shift();
    };
    /** ⇢ legacy alias required by useMessageComposer */
    FixedSizeQueueCache.prototype.add = function (item) {
        this.push(item);
    };
    FixedSizeQueueCache.prototype.peek = function (offset) {
        if (offset === void 0) { offset = -1; }
        if (this.buffer.length === 0)
            return undefined;
        var idx = offset >= 0 ? offset : this.buffer.length + offset;
        return this.buffer[idx];
    };
    Object.defineProperty(FixedSizeQueueCache.prototype, "size", {
        get: function () {
            return this.buffer.length;
        },
        enumerable: false,
        configurable: true
    });
    FixedSizeQueueCache.prototype.getValues = function () {
        return this.buffer;
    };
    FixedSizeQueueCache.prototype.clear = function () {
        this.buffer = [];
    };
    return FixedSizeQueueCache;
}());
exports.FixedSizeQueueCache = FixedSizeQueueCache;
/* -------------------------------- Channel -------------------------------- */
var ChannelState = /** @class */ (function () {
    function ChannelState(notify) {
        if (notify === void 0) { notify = function () { }; }
        this.notify = notify;
        this.messages = [];
        this.messagePagination = { hasPrev: false, hasNext: false };
        this.read = {};
        this.watchers = {};
        this.members = {};
        this.pinnedMessages = [];
        this.typing = {};
        this.threads = {};
    }
    ChannelState.prototype.addMessageSorted = function (msg) {
        this.messages.push(msg);
        this.notify({ messages: this.messages });
    };
    ChannelState.prototype.filterErrorMessages = function () {
        this.messages = this.messages.filter(function (m) { return m.type !== 'error'; });
        this.notify({ messages: this.messages });
    };
    ChannelState.prototype.removeMessage = function (msg) {
        this.messages = this.messages.filter(function (m) { return m.id !== msg.id; });
        this.notify({ messages: this.messages });
    };
    ChannelState.prototype.countUnread = function (userId) {
        var me = this.read[userId];
        return me ? me.unread_messages : 0;
    };
    return ChannelState;
}());
exports.ChannelState = ChannelState;
var LocalChannel = /** @class */ (function () {
    function LocalChannel(cid, sock, getUid) {
        var _this = this;
        this.cid = cid;
        this.sock = sock;
        this.listeners = new Map();
        var _a = cid.split(':'), type = _a[0], id = _a[1];
        this.type = type;
        this.id = id !== null && id !== void 0 ? id : '';
        this.getUserId = getUid;
        this.state = new ChannelState(function (patch) { return _this.stateStore.dispatch(patch); });
        this.stateStore = new StateStore(this.state);
        this.messageComposer = new MessageComposer();
        this.messageComposer.submit = function () {
            var text = _this.messageComposer.state.text.trim();
            if (!text)
                return;
            _this.sendMessage({ text: text });
            _this.messageComposer.reset();
        };
    }
    LocalChannel.prototype.watch = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this]; // SDK returns a promise → UI awaits it
            });
        });
    };
    LocalChannel.prototype.sendMessage = function (msg) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.sock.send(JSON.stringify(__assign({ type: 'message.new', cid: this.cid }, msg)));
                return [2 /*return*/];
            });
        });
    };
    LocalChannel.prototype.on = function (evt, cb) {
        var _this = this;
        if (!this.listeners.has(evt))
            this.listeners.set(evt, new Set());
        this.listeners.get(evt).add(cb);
        // return unsubscribe handle like the real SDK
        return { unsubscribe: function () { return _this.off(evt, cb); } };
    };
    LocalChannel.prototype.off = function (evt, cb) {
        var _a;
        (_a = this.listeners.get(evt)) === null || _a === void 0 ? void 0 : _a.delete(cb);
    };
    /** Fan-out from ChatClient → Channel-level listeners */
    LocalChannel.prototype.emit = function (evt, ev) {
        var _a;
        for (var _i = 0, _b = (_a = this.listeners.get(evt)) !== null && _a !== void 0 ? _a : []; _i < _b.length; _i++) {
            var cb = _b[_i];
            cb(ev);
        }
    };
    LocalChannel.prototype.markRead = function () {
        this.sock.send(JSON.stringify({ type: 'mark.read', cid: this.cid }));
    };
    /** Return basic configuration flags expected by Stream UI */
    LocalChannel.prototype.getConfig = function () {
        return { typing_events: true, read_events: true };
    };
    /** Return unread count for the current user */
    LocalChannel.prototype.countUnread = function () {
        return this.state.countUnread(this.getUserId());
    };
    return LocalChannel;
}());
exports.LocalChannel = LocalChannel;
var LocalChatClient = /** @class */ (function () {
    function LocalChatClient() {
        /* ------------------------------------------------------------------- */
        /*  ░░ 1.   original fields & helpers                                  */
        /* ------------------------------------------------------------------- */
        var _this = this;
        this.sockets = new Map();
        this.channels = new Map();
        this.userId = 'anonymous';
        this.userAgent = 'local-chat-client/0.0.1 stream-chat-react-adapter';
        this.jwt = '';
        /** properties stream-chat-react pokes at */
        this.clientID = '';
        this.activeChannels = {};
        this.listeners = {};
        this.mutedChannels = [];
        /** Minimal threads helper expected by Stream UI */
        this.threads = {
            registerSubscriptions: function () { },
            unregisterSubscriptions: function () { },
        };
        /** Minimal polls helper expected by Stream UI */
        this.polls = {
            store: new StateStore({ polls: [] }),
            registerSubscriptions: function () { },
            unregisterSubscriptions: function () { },
        };
        /** Minimal reminders helper expected by Stream UI */
        this.reminders = new ReminderManager();
        /** Minimal notifications helper expected by Stream UI */
        this.notifications = {
            store: new StateStore({ notifications: [] }),
            registerSubscriptions: function () { },
            unregisterSubscriptions: function () { },
        };
        /* ------------------------------------------------------------------- */
        /*  ░░ 2.   tiny event-bus so  stream-chat-react  can  .on/.off()      */
        /* ------------------------------------------------------------------- */
        this.bus = new Map();
        this.on = function (evt, cb) {
            if (!_this.bus.has(evt))
                _this.bus.set(evt, new Set());
            _this.bus.get(evt).add(cb);
            if (!_this.listeners[evt])
                _this.listeners[evt] = [];
            _this.listeners[evt].push(cb);
            return { unsubscribe: function () { return _this.off(evt, cb); } };
        };
        this.off = function (evt, cb) {
            var _a;
            (_a = _this.bus.get(evt)) === null || _a === void 0 ? void 0 : _a.delete(cb);
            var arr = _this.listeners[evt];
            if (arr) {
                _this.listeners[evt] = arr.filter(function (fn) { return fn !== cb; });
                if (_this.listeners[evt].length === 0)
                    delete _this.listeners[evt];
            }
        };
        this.emit = function (evt, data) { var _a; return (_a = _this.bus.get(evt)) === null || _a === void 0 ? void 0 : _a.forEach(function (cb) { return cb(data); }); };
        /* ------------------------------------------------------------------- */
        /*  ░░ 3.   ultra-thin “state” & “user” objects the hook assumes exist */
        /* ------------------------------------------------------------------- */
        /** Stream’s SDK keeps run-time data in `client.state`. */
        this.state = { channels: new Map() };
        /** Connection indicator the SDK's hooks peek at */
        this.wsConnection = { online: false };
        this.getState = function () { return _this.state; }; // some helper hooks call this
    }
    LocalChatClient.prototype.getUserAgent = function () { return this.userAgent; };
    LocalChatClient.prototype.setUserAgent = function (ua) { this.userAgent = ua; };
    /* ------------------------------------------------------------------- */
    /*  ░░ 4.   websocket lifecycle                                        */
    /* ------------------------------------------------------------------- */
    LocalChatClient.prototype.connectUser = function (user, jwt) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.userId = user.id;
                this.jwt = jwt;
                this.clientID = "".concat(user.id, "--").concat(Math.random().toString(36).slice(2));
                this.activeChannels = {};
                this.listeners = {};
                this.mutedChannels = [];
                this.user = undefined;
                this.wsConnection.online = false;
                /* 4-a ► connections will be opened per-channel */
                /* 4-c ► expose minimal user object & broadcast “online” */
                this.user = { id: this.userId };
                this.wsConnection.online = true;
                this.emit('connection.changed', { online: true });
                return [2 /*return*/];
            });
        });
    };
    LocalChatClient.prototype.queryUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { users: this.user ? [this.user] : [] }];
            });
        });
    };
    LocalChatClient.prototype.channel = function (type, id) {
        var _this = this;
        var cid = "".concat(type, ":").concat(id !== null && id !== void 0 ? id : 'local');
        if (!this.channels.has(cid)) {
            var url = "ws://".concat(location.host, "/ws/").concat(cid, "/?token=").concat(this.jwt);
            var sock = new WebSocket(url);
            sock.onmessage = function (ev) {
                var _a;
                var data = JSON.parse(ev.data);
                (_a = _this.channels.get(data.cid)) === null || _a === void 0 ? void 0 : _a.emit(data.type, data);
            };
            this.sockets.set(cid, sock);
            var chan = new LocalChannel(cid, sock, function () { return _this.userId; });
            this.channels.set(cid, chan);
            this.activeChannels[cid] = chan;
            this.state.channels.set(cid, chan);
        }
        return this.channels.get(cid);
    };
    LocalChatClient.prototype.disconnectUser = function () {
        this.sockets.forEach(function (s) { return s.close(); });
        this.sockets.clear();
        this.channels.clear();
        this.activeChannels = {};
        this.listeners = {};
        this.mutedChannels = [];
        this.state.channels.clear();
        this.user = undefined;
        this.wsConnection.online = false;
        this.userId = 'anonymous';
        this.clientID = '';
        this.emit('connection.changed', { online: false });
    };
    return LocalChatClient;
}());
exports.LocalChatClient = LocalChatClient;
var LinkPreviewStatus;
(function (LinkPreviewStatus) {
    LinkPreviewStatus["dismissed"] = "dismissed";
    LinkPreviewStatus["failed"] = "failed";
    LinkPreviewStatus["loaded"] = "loaded";
    LinkPreviewStatus["loading"] = "loading";
    LinkPreviewStatus["pending"] = "pending";
})(LinkPreviewStatus || (exports.LinkPreviewStatus = LinkPreviewStatus = {}));
/* ------------------------- Link preview manager ------------------------- */
var LinkPreviewsManager = /** @class */ (function () {
    function LinkPreviewsManager(limit) {
        if (limit === void 0) { limit = 100; }
        this.limit = limit;
        this.cache = new Map();
        /** private store the hooks subscribe to */
        this.store = new StateStore({
            previews: this.cache,
        });
        /* legacy alias expected by old Stream-Chat-React hooks */
        this.store.getLatestValue = this.store.getState.bind(this);
    }
    Object.defineProperty(LinkPreviewsManager.prototype, "state", {
        /* ── compatibility ──────────────────────────────────────────────────── */
        /** Stream-Chat-React reads `linkPreviews.state.getLatestValue()` and
            `.state.subscribe(cb)`, so expose the store via a getter.            */
        get: function () {
            return this.store;
        },
        enumerable: false,
        configurable: true
    });
    /* ── business logic ─────────────────────────────────────────────────── */
    /** Fetch (or return cached) preview data, then broadcast it */
    LinkPreviewsManager.prototype.fetch = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, resp, data, _a, firstKey;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cached = this.cache.get(url);
                        if (cached) {
                            /* refresh LRU order */
                            this.cache.delete(url);
                            this.cache.set(url, cached);
                            return [2 /*return*/, cached];
                        }
                        return [4 /*yield*/, fetch("/api/link-preview?url=".concat(encodeURIComponent(url)))];
                    case 1:
                        resp = _b.sent();
                        _a = [{}];
                        return [4 /*yield*/, resp.json()];
                    case 2:
                        data = __assign.apply(void 0, [__assign.apply(void 0, _a.concat([(_b.sent())])), { status: LinkPreviewStatus.loaded }]);
                        this.cache.set(url, data);
                        if (this.cache.size > this.limit) {
                            firstKey = this.cache.keys().next().value;
                            if (firstKey)
                                this.cache.delete(firstKey);
                        }
                        /* notify any subscribers */
                        this.store.dispatch({ previews: this.cache });
                        return [2 /*return*/, data];
                }
            });
        });
    };
    /** Mark a preview as dismissed and broadcast the change */
    LinkPreviewsManager.prototype.dismissPreview = function (url) {
        var preview = this.cache.get(url);
        if (preview) {
            preview.status = LinkPreviewStatus.dismissed;
            this.cache.set(url, preview);
            this.store.dispatch({ previews: this.cache });
        }
    };
    /* ── static helpers used by Stream-Chat-React ───────────────────────── */
    LinkPreviewsManager.previewIsLoading = function (p) { return p.status === LinkPreviewStatus.loading; };
    LinkPreviewsManager.previewIsLoaded = function (p) { return p.status === LinkPreviewStatus.loaded; };
    LinkPreviewsManager.previewIsDismissed = function (p) { return p.status === LinkPreviewStatus.dismissed; };
    LinkPreviewsManager.previewIsFailed = function (p) { return p.status === LinkPreviewStatus.failed; };
    LinkPreviewsManager.previewIsPending = function (p) { return p.status === LinkPreviewStatus.pending || !p.status; };
    LinkPreviewsManager.getPreviewData = function (p) {
        var status = p.status, rest = __rest(p, ["status"]);
        return rest;
    };
    return LinkPreviewsManager;
}());
exports.LinkPreviewsManager = LinkPreviewsManager;
/* --------------------------- compatibility stub -------------------------- */
/** Return the *same* LocalChatClient for any api-key – good enough for local */
var _singleton;
/** A lightweight class so it is both a value **and** a type. */
var StreamChat = /** @class */ (function (_super) {
    __extends(StreamChat, _super);
    function StreamChat() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /** Return the same client for any apiKey – good enough for local dev. */
    StreamChat.getInstance = function (_apiKey) {
        if (!_singleton)
            _singleton = new StreamChat();
        return _singleton;
    };
    return StreamChat;
}(LocalChatClient));
exports.StreamChat = StreamChat;
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
var getLocalClient = function () { return StreamChat.getInstance(); };
exports.getLocalClient = getLocalClient;
function formatMessage(text) {
    var linkified = text.replace(/https?:\/+[^\s]+/g, function (url) {
        return "<a href=\"".concat(url, "\" target=\"_blank\" rel=\"noreferrer\">").concat(url, "</a>");
    });
    var emoji = require('emoji-dictionary');
    return linkified.replace(/:([a-z0-9_+-]+):/gi, function (m, name) {
        var ch = emoji.getUnicode(name);
        return ch || m;
    });
}
/** Convert a LocalMessage (client-side representation) into the payload sent
 *  when creating a new message. Maps `id` → `tmp_id` and attaches
 *  `user: { id }`. Any remaining fields are copied over unchanged.
 */
function localMessageToNewMessagePayload(local) {
    var _a = local !== null && local !== void 0 ? local : {}, id = _a.id, user_id = _a.user_id, rest = __rest(_a, ["id", "user_id"]);
    return __assign(__assign({}, rest), { tmp_id: id, user: { id: user_id } });
}
/* --------------------------- value helpers ---------------------------- */
/** Return true when attachment originated from link preview scraping */
function isScrapedContent(a) {
    return !!(a === null || a === void 0 ? void 0 : a.og_scrape_url);
}
function hasExt(name, exts) {
    if (!name)
        return false;
    var n = name.toLowerCase();
    return exts.some(function (e) { return n.endsWith(e); });
}
/** Fallback detection for generic file attachments */
function isFileAttachment(a) {
    var _a, _b, _c;
    var mime = ((_a = a === null || a === void 0 ? void 0 : a.mime_type) !== null && _a !== void 0 ? _a : '').toLowerCase();
    var name = ((_c = (_b = a === null || a === void 0 ? void 0 : a.name) !== null && _b !== void 0 ? _b : a === null || a === void 0 ? void 0 : a.fallback) !== null && _c !== void 0 ? _c : '').toLowerCase();
    var isImage = mime.startsWith('image/') || hasExt(name, ['.jpg', '.jpeg', '.png', '.gif']);
    var isVideo = mime.startsWith('video/') || hasExt(name, ['.mp4', '.webm']);
    var isAudio = mime.startsWith('audio/') || hasExt(name, ['.mp3', '.wav']);
    return !(isImage || isVideo || isAudio || isScrapedContent(a));
}
/* --------------------------- attachment helpers ------------------------- */
var isVoiceRecordingAttachment = function (a) {
    return !!a && typeof a.mime_type === 'string' &&
        a.mime_type.startsWith('audio/') && Array.isArray(a.waveform);
};
exports.isVoiceRecordingAttachment = isVoiceRecordingAttachment;
var IMG_RX = /\.(?:jpe?g|png|gif)$/i;
var VID_RX = /\.(?:mp4|webm)$/i;
var AUD_RX = /\.(?:mp3|wav)$/i;
var getMime = function (a) { var _a; return ((a === null || a === void 0 ? void 0 : a.mime_type) || ((_a = a === null || a === void 0 ? void 0 : a.file) === null || _a === void 0 ? void 0 : _a.type) || '').toLowerCase(); };
var getName = function (a) { var _a; return (((_a = a === null || a === void 0 ? void 0 : a.file) === null || _a === void 0 ? void 0 : _a.name) || '').toLowerCase(); };
var isLocalAttachment = function (a) {
    if (!a)
        return false;
    var hasFile = typeof File !== 'undefined' && a.file instanceof File;
    return hasFile || a.state === 'uploading';
};
exports.isLocalAttachment = isLocalAttachment;
var isLocalUploadAttachment = function (a) {
    return (0, exports.isLocalAttachment)(a) && a.state === 'uploading';
};
exports.isLocalUploadAttachment = isLocalUploadAttachment;
var isLocalImageAttachment = function (a) {
    return (0, exports.isLocalAttachment)(a) &&
        (getMime(a).startsWith('image/') || IMG_RX.test(getName(a)));
};
exports.isLocalImageAttachment = isLocalImageAttachment;
var isLocalVideoAttachment = function (a) {
    return (0, exports.isLocalAttachment)(a) &&
        (getMime(a).startsWith('video/') || VID_RX.test(getName(a)));
};
exports.isLocalVideoAttachment = isLocalVideoAttachment;
var isLocalAudioAttachment = function (a) {
    return (0, exports.isLocalAttachment)(a) &&
        (getMime(a).startsWith('audio/') || AUD_RX.test(getName(a)));
};
exports.isLocalAudioAttachment = isLocalAudioAttachment;
var isLocalVoiceRecordingAttachment = function (a) {
    return (0, exports.isLocalAudioAttachment)(a) && Array.isArray(a.waveform);
};
exports.isLocalVoiceRecordingAttachment = isLocalVoiceRecordingAttachment;
var isLocalFileAttachment = function (a) {
    return (0, exports.isLocalAttachment)(a) &&
        !((0, exports.isLocalImageAttachment)(a) ||
            (0, exports.isLocalVideoAttachment)(a) ||
            (0, exports.isLocalAudioAttachment)(a));
};
exports.isLocalFileAttachment = isLocalFileAttachment;
/* ------------------------------ helpers -------------------------------- */
var _nameFrom = function (a) {
    return ((a === null || a === void 0 ? void 0 : a.name) ||
        (a === null || a === void 0 ? void 0 : a.title) ||
        (a === null || a === void 0 ? void 0 : a.filename) ||
        (a === null || a === void 0 ? void 0 : a.asset_url) ||
        '').toLowerCase();
};
var _hasExt = function (a, exts) {
    return exts.some(function (ext) { return _nameFrom(a).endsWith(ext); });
};
var isImageAttachment = function (a) {
    var mime = ((a === null || a === void 0 ? void 0 : a.mime_type) || '').toLowerCase();
    if (/^image\/(jpeg|jpg|png|gif)/.test(mime))
        return true;
    return _hasExt(a, ['.jpeg', '.jpg', '.png', '.gif']);
};
exports.isImageAttachment = isImageAttachment;
var isVideoAttachment = function (a) {
    var mime = ((a === null || a === void 0 ? void 0 : a.mime_type) || '').toLowerCase();
    if (/^video\/(mp4|webm)/.test(mime))
        return true;
    return _hasExt(a, ['.mp4', '.webm']);
};
exports.isVideoAttachment = isVideoAttachment;
var isAudioAttachment = function (a) {
    var mime = ((a === null || a === void 0 ? void 0 : a.mime_type) || '').toLowerCase();
    if (/^audio\/(mp3|mpeg|wav)/.test(mime))
        return true;
    return _hasExt(a, ['.mp3', '.wav']);
};
exports.isAudioAttachment = isAudioAttachment;
var MessageComposer = /** @class */ (function () {
    function MessageComposer(_config) {
        if (_config === void 0) { _config = {}; }
        this.contextType = 'message';
        this.state = { text: '', attachments: [] };
        this.configState = new StateStore(__assign({ attachments: {
                acceptedFiles: [],
                fileUploadFilter: function () { return true; },
                maxNumberOfFilesPerMessage: 10,
            }, drafts: { enabled: false }, linkPreviews: {
                debounceURLEnrichmentMs: 1500,
                enabled: false,
                findURLFn: function (_t) { return []; },
            }, text: { enabled: true, publishTypingEvents: true } }, _config));
        var attState = new StateStore({ attachments: [] });
        this.attachmentManager = {
            state: attState,
            availableUploadSlots: 10,
            addFiles: function (files) {
                return __awaiter(this, void 0, void 0, function () {
                    var list, _i, files_1, f;
                    return __generator(this, function (_a) {
                        list = __spreadArray([], attState.getLatestValue().attachments, true);
                        for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                            f = files_1[_i];
                            list.push({ id: "local-".concat(Date.now()), file: f });
                        }
                        attState.dispatch({ attachments: list });
                        return [2 /*return*/];
                    });
                });
            },
            removeAttachment: function (id) {
                var list = attState.getLatestValue().attachments.filter(function (a) { return a.id !== id; });
                attState.dispatch({ attachments: list });
            },
            replaceAttachment: function (oldAtt, newAtt) {
                var list = attState.getLatestValue().attachments.map(function (a) { return a === oldAtt ? newAtt : a; });
                attState.dispatch({ attachments: list });
            },
        };
        var lpState = new StateStore({ previews: new Map() });
        var manager = new LinkPreviewsManager();
        this.linkPreviewsManager = {
            state: lpState,
            add: function (url) {
                return __awaiter(this, void 0, void 0, function () {
                    var preview, map;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, manager.fetch(url)];
                            case 1:
                                preview = _a.sent();
                                map = new Map(lpState.getLatestValue().previews);
                                map.set(url, preview);
                                lpState.dispatch({ previews: map });
                                return [2 /*return*/, preview];
                        }
                    });
                });
            },
            remove: function (url) {
                var map = new Map(lpState.getLatestValue().previews);
                map.delete(url);
                manager.dismissPreview(url);
                lpState.dispatch({ previews: map });
            },
            clear: function () {
                lpState.dispatch({ previews: new Map() });
            },
        };
    }
    MessageComposer.prototype.reset = function () {
        this.state = { text: '', attachments: [] };
    };
    MessageComposer.prototype.setText = function (text) {
        this.state.text = text;
    };
    MessageComposer.prototype.addAttachment = function (att) {
        this.state.attachments.push(att);
    };
    /** simple helper used by LocalChannel */
    MessageComposer.prototype.submit = function (send) {
        var text = this.state.text.trim();
        if (!text || !send)
            return;
        send(text);
        this.reset();
    };
    return MessageComposer;
}());
exports.MessageComposer = MessageComposer;
var VotingVisibility;
(function (VotingVisibility) {
    VotingVisibility["anonymous"] = "anonymous";
    VotingVisibility["public"] = "public";
})(VotingVisibility || (exports.VotingVisibility = VotingVisibility = {}));
var isVoteAnswer = function (vote) { return !!vote.answer_text; };
exports.isVoteAnswer = isVoteAnswer;
/** Minimal manager that schedules timeouts for reminders */
var ReminderManager = /** @class */ (function () {
    function ReminderManager() {
        this.store = new StateStore({ reminders: [] });
        this.timers = new Map();
    }
    ReminderManager.prototype.registerSubscriptions = function () { };
    ReminderManager.prototype.unregisterSubscriptions = function () { };
    /** schedule timers for all reminders in the store */
    ReminderManager.prototype.initTimers = function () {
        var _this = this;
        this.clearTimers();
        var reminders = this.store.getLatestValue().reminders;
        var _loop_1 = function (r) {
            var delay = new Date(r.reminder.remind_at).getTime() - Date.now();
            var t = setTimeout(function () {
                _this.timers.delete(r.reminder.id);
            }, Math.max(0, delay));
            r.timer = t;
            this_1.timers.set(r.reminder.id, t);
        };
        var this_1 = this;
        for (var _i = 0, reminders_1 = reminders; _i < reminders_1.length; _i++) {
            var r = reminders_1[_i];
            _loop_1(r);
        }
    };
    /** clear all scheduled reminders */
    ReminderManager.prototype.clearTimers = function () {
        for (var _i = 0, _a = this.timers.values(); _i < _a.length; _i++) {
            var t = _a[_i];
            clearTimeout(t);
        }
        this.timers.clear();
        var reminders = this.store.getLatestValue().reminders;
        for (var _b = 0, reminders_2 = reminders; _b < reminders_2.length; _b++) {
            var r = reminders_2[_b];
            r.timer = undefined;
        }
    };
    return ReminderManager;
}());
exports.ReminderManager = ReminderManager;
function getTriggerCharWithToken(text, triggers) {
    if (triggers === void 0) { triggers = ['@', '/']; }
    var words = text.split(/\s+/);
    for (var i = words.length - 1; i >= 0; i--) {
        var w = words[i];
        if (w && triggers.includes(w[0]))
            return w;
    }
    return '';
}
function insertItemWithTrigger(text, item, triggers) {
    if (triggers === void 0) { triggers = ['@', '/']; }
    var token = getTriggerCharWithToken(String(text), triggers);
    if (!token)
        return text;
    return String(text).replace(token, token[0] + item + ' ');
}
function replaceWordWithEntity(text, word, entity) {
    return String(text).replace(word, entity);
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
var StateStore = /** @class */ (function () {
    function StateStore(init) {
        this.listeners = new Set();
        /** rxjs-compat alias */
        this.next = this.dispatch.bind(this);
        this.state = init;
    }
    StateStore.prototype.getState = function () {
        return this.state;
    };
    /** subscribe to state changes */
    StateStore.prototype.subscribe = function (cb) {
        var _this = this;
        this.listeners.add(cb);
        return function () { return _this.listeners.delete(cb); };
    };
    /** subscribe to a slice of the state */
    StateStore.prototype.subscribeWithSelector = function (selector, cb) {
        var _this = this;
        var prev = selector(this.state);
        return this.subscribe(function () {
            var next = selector(_this.state);
            if (next !== prev) {
                prev = next;
                cb();
            }
        });
    };
    /** latest state snapshot for hooks */
    StateStore.prototype.getLatestValue = function () {
        return this.state;
    };
    /** dispatch a partial state update */
    StateStore.prototype.dispatch = function (patch) {
        this.state = __assign(__assign({}, this.state), patch);
        this.listeners.forEach(function (l) { return l(); });
    };
    /** stream-ui alias */
    StateStore.prototype.partialNext = function (patch) {
        this.dispatch(patch);
    };
    return StateStore;
}());
exports.StateStore = StateStore;
/** React hook that subscribes to a StateStore and returns its latest value */
function useStateStore(store, selector) {
    var _a, _b;
    if (selector === void 0) { selector = function (v) { return v; }; }
    if (!store || typeof store.subscribe !== 'function')
        return undefined;
    var getter = (_b = (_a = store.getLatestValue) !== null && _a !== void 0 ? _a : store.getSnapshot) !== null && _b !== void 0 ? _b : (function () { return undefined; });
    return (0, react_1.useSyncExternalStore)(store.subscribe.bind(store), function () { return selector(getter()); }, function () { return selector(getter()); });
}
var SearchSourceType;
(function (SearchSourceType) {
    SearchSourceType["channel"] = "channel";
    SearchSourceType["message"] = "message";
    SearchSourceType["user"] = "user";
})(SearchSourceType || (exports.SearchSourceType = SearchSourceType = {}));
var BaseSearchSource = /** @class */ (function () {
    function BaseSearchSource(client) {
        this.client = client;
        this.state = new StateStore({ isLoading: false });
    }
    BaseSearchSource.prototype.query = function (_text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, []];
            });
        });
    };
    return BaseSearchSource;
}());
exports.BaseSearchSource = BaseSearchSource;
var ChannelSearchSource = /** @class */ (function (_super) {
    __extends(ChannelSearchSource, _super);
    function ChannelSearchSource() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = SearchSourceType.channel;
        return _this;
    }
    return ChannelSearchSource;
}(BaseSearchSource));
exports.ChannelSearchSource = ChannelSearchSource;
var MessageSearchSource = /** @class */ (function (_super) {
    __extends(MessageSearchSource, _super);
    function MessageSearchSource() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = SearchSourceType.message;
        return _this;
    }
    return MessageSearchSource;
}(BaseSearchSource));
exports.MessageSearchSource = MessageSearchSource;
var UserSearchSource = /** @class */ (function (_super) {
    __extends(UserSearchSource, _super);
    function UserSearchSource() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = SearchSourceType.user;
        return _this;
    }
    return UserSearchSource;
}(BaseSearchSource));
exports.UserSearchSource = UserSearchSource;
/** Controller that manages multiple search sources */
var SearchController = /** @class */ (function () {
    function SearchController(opts) {
        if (opts === void 0) { opts = {}; }
        var _a;
        var sources = (_a = opts.sources) !== null && _a !== void 0 ? _a : [];
        this.state = new StateStore({
            focusedMessage: undefined,
            sources: sources,
        });
        this._internalState = this.state;
    }
    SearchController.prototype.query = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var sources, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sources = this.state.getLatestValue().sources;
                        return [4 /*yield*/, Promise.all(sources.map(function (s) { return s.query(query); }))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.flat()];
                }
            });
        });
    };
    return SearchController;
}());
exports.SearchController = SearchController;
