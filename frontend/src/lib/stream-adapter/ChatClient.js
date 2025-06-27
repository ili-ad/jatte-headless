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
exports.ChatClient = void 0;
var mitt_1 = require("mitt");
var MiniStore_1 = require("./MiniStore");
var Channel_1 = require("./Channel");
var constants_1 = require("./constants");
var api_1 = require("../api");
var tokenManager_1 = require("./tokenManager");
var randomId = function () { return Math.random().toString(36).slice(2); };
/* ------------------------------------------------------------------ */
/* High-level client wrapper that Stream-UI talks to                  */
/* ------------------------------------------------------------------ */
var ChatClient = /** @class */ (function () {
    /* ----------------------------------------------------------- */
    function ChatClient(userId, jwt) {
        if (userId === void 0) { userId = null; }
        if (jwt === void 0) { jwt = null; }
        var _this = this;
        this.userId = userId;
        this.jwt = jwt;
        /** copy of the full user object returned from backend */
        this._user = null;
        this.authToken = null;
        this.emitter = (0, mitt_1.default)();
        /** Unique ID for the current connection (null until connected) */
        this.connectionId = null;
        /** Whether the client is currently disconnected */
        this.disconnected = true;
        /** Whether the client finished initialization */
        this.initialized = false;
        /** Promise resolving when websocket auth completes */
        this.wsPromise = null;
        this.userAgent = 'custom-chat-client/0.0.1 stream-chat-react-adapter';
        this.activeChannels = {};
        this.mutedChannels = [];
        this.mutedUsers = [];
        this.listeners = {};
        /** Minimal client.state stub holding fetched users */
        this.state = { users: {} };
        /** global stores Stream-UI subscribes to */
        this.stateStore = new MiniStore_1.MiniStore({ channels: [] });
        this.settingsStore = new MiniStore_1.MiniStore(null);
        this.bus = (0, mitt_1.default)();
        /** Minimal axios-like helper used by Stream-UI */
        this.axiosInstance = {
            get: function (url_1) {
                var args_1 = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args_1[_i - 1] = arguments[_i];
                }
                return __awaiter(_this, __spreadArray([url_1], args_1, true), void 0, function (url, config) {
                    var path, res, data;
                    if (config === void 0) { config = {}; }
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                path = url.startsWith('/api') ? url.slice(4) : url;
                                return [4 /*yield*/, (0, api_1.apiFetch)(path, { method: 'GET', headers: this.buildHeaders(config.headers) })];
                            case 1:
                                res = _a.sent();
                                return [4 /*yield*/, res.json().catch(function () { return null; })];
                            case 2:
                                data = _a.sent();
                                return [2 /*return*/, { data: data, status: res.status, statusText: res.statusText }];
                        }
                    });
                });
            },
            post: function (url_1, data_1) {
                var args_1 = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    args_1[_i - 2] = arguments[_i];
                }
                return __awaiter(_this, __spreadArray([url_1, data_1], args_1, true), void 0, function (url, data, config) {
                    var path, res, body;
                    if (config === void 0) { config = {}; }
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                path = url.startsWith('/api') ? url.slice(4) : url;
                                return [4 /*yield*/, (0, api_1.apiFetch)(path, {
                                        method: 'POST',
                                        headers: this.buildHeaders(__assign({ 'Content-Type': 'application/json' }, (config.headers || {}))),
                                        body: JSON.stringify(data !== null && data !== void 0 ? data : {}),
                                    })];
                            case 1:
                                res = _a.sent();
                                return [4 /*yield*/, res.json().catch(function () { return null; })];
                            case 2:
                                body = _a.sent();
                                return [2 /*return*/, { data: body, status: res.status, statusText: res.statusText }];
                        }
                    });
                });
            },
            delete: function (url_1) {
                var args_1 = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args_1[_i - 1] = arguments[_i];
                }
                return __awaiter(_this, __spreadArray([url_1], args_1, true), void 0, function (url, config) {
                    var path, res, body;
                    if (config === void 0) { config = {}; }
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                path = url.startsWith('/api') ? url.slice(4) : url;
                                return [4 /*yield*/, (0, api_1.apiFetch)(path, { method: 'DELETE', headers: this.buildHeaders(config.headers) })];
                            case 1:
                                res = _a.sent();
                                return [4 /*yield*/, res.json().catch(function () { return null; })];
                            case 2:
                                body = _a.sent();
                                return [2 /*return*/, { data: body, status: res.status, statusText: res.statusText }];
                        }
                    });
                });
            },
        };
        /* ---------- event-bus helpers ---------- */
        this.on = function (event, cb) {
            if (!_this.listeners[event])
                _this.listeners[event] = [];
            _this.listeners[event].push(cb);
            _this.bus.on(event, cb);
        };
        this.off = function (event, cb) {
            _this.bus.off(event, cb);
            var arr = _this.listeners[event];
            if (arr) {
                _this.listeners[event] = arr.filter(function (fn) { return fn !== cb; });
                if (_this.listeners[event].length === 0)
                    delete _this.listeners[event];
            }
        };
        this.emit = this.bus.emit.bind(this);
        this.user = { id: userId };
        if (userId)
            this._user = { id: userId };
        this.clientID = randomId();
        this.tokenManager = new tokenManager_1.TokenManager(jwt || undefined);
        /* Basic threads manager */
        this.threads = {
            state: new MiniStore_1.MiniStore({
                threads: [],
                unseenThreadIds: [],
                unreadThreadCount: 0,
                pagination: { isLoadingNext: false },
            }),
            registerSubscriptions: function () { },
            unregisterSubscriptions: function () { },
            reload: function () {
                return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getThreads()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                }); });
            },
            loadNextPage: function () {
                return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getThreads()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                }); });
            },
            activate: function () { },
            deactivate: function () { },
        };
        this.polls = {
            store: new MiniStore_1.MiniStore({ polls: [] }),
            registerSubscriptions: function () { },
            unregisterSubscriptions: function () { },
        };
        this.reminders = {
            store: new MiniStore_1.MiniStore({ reminders: [] }),
            registerSubscriptions: function () { },
            unregisterSubscriptions: function () { },
            initTimers: function () { },
            clearTimers: function () { },
        };
        /* initialise empty notifications store                              */
        // ChatClient.ts  – inside the constructor
        this.notifications = {
            store: new MiniStore_1.MiniStore({
                notifications: [], // 👈  cast to any[]
            }),
        };
    }
    /**
     * Manually dispatch an event to this client and its channels.
     * Only a tiny subset of Stream events is supported.
     */
    ChatClient.prototype.dispatchEvent = function (event) {
        if (event.cid) {
            var chan = this.activeChannels[event.cid];
            if (chan && typeof chan.dispatchEvent === 'function') {
                chan.dispatchEvent(event);
            }
        }
        var token = this.jwt;
        if (token) {
            (0, api_1.apiFetch)(constants_1.API.DISPATCH_EVENT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: "Bearer ".concat(this.authToken),
                },
                body: JSON.stringify(event),
            }).catch(function () { });
        }
        this.emit(event.type, event);
    };
    ChatClient.prototype.buildHeaders = function (extra) {
        if (extra === void 0) { extra = {}; }
        return this.authToken ? __assign({ Authorization: "Bearer ".concat(this.authToken) }, extra) : extra;
    };
    ChatClient.prototype.getUserAgent = function () {
        return this.userAgent;
    };
    ChatClient.prototype.setUserAgent = function (ua) {
        this.userAgent = ua;
        if (this.authToken) {
            (0, api_1.apiFetch)(constants_1.API.USER_AGENT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: "Bearer ".concat(this.authToken),
                },
                body: JSON.stringify({ user_agent: ua }),
            }).catch(function () { });
        }
    };
    ChatClient.prototype.refreshToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var newToken;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.tokenManager.refreshToken(constants_1.API.REFRESH_TOKEN)];
                    case 1:
                        newToken = _a.sent();
                        this.jwt = newToken;
                        return [2 /*return*/, newToken];
                }
            });
        });
    };
    Object.defineProperty(ChatClient.prototype, "userID", {
        /** Return the currently connected user's ID, if any */
        get: function () {
            return this.userId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ChatClient.prototype, "userToken", {
        /** Return the JWT token currently in use, if any */
        get: function () {
            return this.jwt;
        },
        enumerable: false,
        configurable: true
    });
    /** Initialize the client for a given user */
    /**
     * Register a user and emit the same events Stream’s SDK does.
     * Resolves only on successful sync.
     */
    ChatClient.prototype.connectUser = function (user, token, authToken) {
        return __awaiter(this, void 0, void 0, function () {
            var cidRes, cidBody, _a, res, body, cidRes, cidBody, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.userId = user.id;
                        this.jwt = token;
                        this.authToken = authToken !== null && authToken !== void 0 ? authToken : token;
                        return [4 /*yield*/, this.tokenManager.setTokenOrProvider(token)];
                    case 1:
                        _c.sent();
                        this.user = { id: user.id };
                        this.clientID = "".concat(user.id, "--").concat(randomId());
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 6, , 7]);
                        return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.CLIENT_ID, {
                                headers: { Authorization: "Bearer ".concat(this.authToken) },
                            })];
                    case 3:
                        cidRes = _c.sent();
                        if (!cidRes.ok) return [3 /*break*/, 5];
                        return [4 /*yield*/, cidRes.json().catch(function () { return null; })];
                    case 4:
                        cidBody = _c.sent();
                        if (cidBody && cidBody.client_id) {
                            this.clientID = "".concat(user.id, "--").concat(cidBody.client_id);
                        }
                        _c.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        _a = _c.sent();
                        return [3 /*break*/, 7];
                    case 7: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.SYNC_USER, {
                            method: 'POST',
                            headers: {
                                Authorization: "Bearer ".concat(this.authToken),
                            },
                        })];
                    case 8:
                        res = _c.sent();
                        if (!res.ok)
                            throw new Error('sync-user failed');
                        return [4 /*yield*/, res.json().catch(function () { return null; })];
                    case 9:
                        body = _c.sent();
                        if (body) {
                            this._user = body;
                            this.state.users[String(body.id)] = body;
                        }
                        this.wsPromise = (0, api_1.apiFetch)(constants_1.API.WS_AUTH, {
                            headers: { Authorization: "Bearer ".concat(this.authToken) },
                        }).then(function () { return undefined; });
                        return [4 /*yield*/, this.wsPromise];
                    case 10:
                        _c.sent();
                        _c.label = 11;
                    case 11:
                        _c.trys.push([11, 15, , 16]);
                        return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.CONNECTION_ID, {
                                headers: { Authorization: "Bearer ".concat(this.authToken) },
                            })];
                    case 12:
                        cidRes = _c.sent();
                        if (!cidRes.ok) return [3 /*break*/, 14];
                        return [4 /*yield*/, cidRes.json().catch(function () { return null; })];
                    case 13:
                        cidBody = _c.sent();
                        if (cidBody && cidBody.connection_id) {
                            this.connectionId = cidBody.connection_id;
                        }
                        _c.label = 14;
                    case 14: return [3 /*break*/, 16];
                    case 15:
                        _b = _c.sent();
                        return [3 /*break*/, 16];
                    case 16:
                        if (!this.connectionId) {
                            this.connectionId = crypto.randomUUID();
                        }
                        this.initialized = true;
                        this.disconnected = false;
                        this.emit('connection.changed', { online: true });
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Tear-down helper mirroring Stream’s client.disconnectUser */
    ChatClient.prototype.disconnectUser = function () {
        var token = this.jwt;
        if (token) {
            (0, api_1.apiFetch)(constants_1.API.SESSION, {
                method: 'DELETE',
                headers: { Authorization: "Bearer ".concat(this.authToken) },
            }).catch(function () { });
        }
        this.activeChannels = {};
        this.stateStore._set({ channels: [] });
        delete this.user;
        this._user = null;
        this.userId = null;
        this.jwt = null;
        this.authToken = null;
        this.tokenManager.reset();
        this.connectionId = null;
        this.initialized = false;
        this.disconnected = true;
        this.emit('connection.changed', { online: false });
    };
    /* ---------- API that Stream-UI actually calls ---------- */
    /** fetch list of channels for <ChannelList> */
    ChatClient.prototype.queryChannels = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, rooms, _a, chans;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.ROOMS, {
                            headers: this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {},
                        })];
                    case 1:
                        res = _b.sent();
                        if (!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = [];
                        _b.label = 4;
                    case 4:
                        rooms = _a;
                        chans = rooms.map(function (r) { var _a; return new Channel_1.Channel(r.id, r.uuid, (_a = r.name) !== null && _a !== void 0 ? _a : r.uuid, _this, r.data || {}); });
                        this.stateStore._set({ channels: chans });
                        return [2 /*return*/, chans];
                }
            });
        });
    };
    /** fetch list of users */
    ChatClient.prototype.queryUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, list, _i, list_1, u;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.USERS, {
                            headers: this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {},
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        list = _a.sent();
                        for (_i = 0, list_1 = list; _i < list_1.length; _i++) {
                            u = list_1[_i];
                            this.state.users[String(u.id)] = u;
                        }
                        return [2 /*return*/, list];
                }
            });
        });
    };
    /** Fetch the currently authenticated user */
    ChatClient.prototype.getUser = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, info;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.USER, {
                            headers: this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {},
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('user fetch failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        info = _a.sent();
                        this.user = { id: String(info.id) };
                        this._user = info;
                        this.state.users[String(info.id)] = info;
                        return [2 /*return*/, info];
                }
            });
        });
    };
    /** fetch global app settings */
    ChatClient.prototype.getAppSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, settings;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.APP_SETTINGS, {
                            headers: this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {},
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('getAppSettings failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        settings = _a.sent();
                        this.settingsStore._set(settings);
                        this.emit(constants_1.EVENTS.SETTINGS_UPDATED, settings);
                        return [2 /*return*/, settings];
                }
            });
        });
    };
    /** fetch notifications for the current user */
    ChatClient.prototype.getNotifications = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, list;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.NOTIFICATIONS, {
                            headers: this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {},
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('getNotifications failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        list = _a.sent();
                        this.notifications.store._set({ notifications: list });
                        return [2 /*return*/, list];
                }
            });
        });
    };
    /** fetch list of polls */
    ChatClient.prototype.getPolls = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, list;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.POLLS, {
                            headers: this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {},
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('getPolls failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        list = _a.sent();
                        this.polls.store._set({ polls: list });
                        return [2 /*return*/, list];
                }
            });
        });
    };
    /** fetch list of reminders */
    ChatClient.prototype.getReminders = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, list;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.REMINDERS, {
                            headers: this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {},
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('getReminders failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        list = _a.sent();
                        this.reminders.store._set({ reminders: list });
                        return [2 /*return*/, list];
                }
            });
        });
    };
    /** fetch list of threads */
    ChatClient.prototype.getThreads = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, list;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.THREADS, {
                            headers: this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {},
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('getThreads failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        list = _a.sent();
                        this.threads.state._set({
                            threads: list,
                            unseenThreadIds: [],
                            unreadThreadCount: 0,
                            pagination: { isLoadingNext: false },
                        });
                        return [2 /*return*/, list];
                }
            });
        });
    };
    /** fetch list of users muted by the current user */
    ChatClient.prototype.getMutedUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, list;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.MUTED_USERS, {
                            headers: this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {},
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('getMutedUsers failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        list = _a.sent();
                        this.mutedUsers = list;
                        return [2 /*return*/, list];
                }
            });
        });
    };
    /** list of currently active channels */
    ChatClient.prototype.getActiveChannels = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, rooms, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.ACTIVE_ROOMS, {
                            headers: this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {},
                        })];
                    case 1:
                        res = _b.sent();
                        if (!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json()];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = [];
                        _b.label = 4;
                    case 4:
                        rooms = _a;
                        return [2 /*return*/, rooms.map(function (r) { var _a; return new Channel_1.Channel(r.id, r.uuid, (_a = r.name) !== null && _a !== void 0 ? _a : r.uuid, _this, r.data || {}); })];
                }
            });
        });
    };
    /** list of muted channels for the current user */
    ChatClient.prototype.getMutedChannels = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, rooms;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.MUTED_CHANNELS, {
                            headers: this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {},
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('getMutedChannels failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        rooms = _a.sent();
                        this.mutedChannels = rooms.map(function (r) { var _a; return new Channel_1.Channel(r.id, r.uuid, (_a = r.name) !== null && _a !== void 0 ? _a : r.uuid, _this, r.data || {}); });
                        return [2 /*return*/, this.mutedChannels];
                }
            });
        });
    };
    /** fetch list of supported event listeners */
    ChatClient.prototype.getListeners = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.LISTENERS, {
                            headers: this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {},
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('getListeners failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data.listeners];
                }
            });
        });
    };
    /** Check if a given user is muted */
    ChatClient.prototype.muteStatus = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MUTE_STATUS).concat(userId, "/"), {
                            headers: this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {},
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('muteStatus failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data.muted];
                }
            });
        });
    };
    /** Mute a user */
    ChatClient.prototype.muteUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MUTE_USER).concat(userId, "/"), {
                            method: 'POST',
                            headers: { Authorization: "Bearer ".concat(this.authToken) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('muteUser failed');
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Unmute a user */
    ChatClient.prototype.unmuteUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.UNMUTE_USER).concat(userId, "/"), {
                            method: 'POST',
                            headers: { Authorization: "Bearer ".concat(this.authToken) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('unmuteUser failed');
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Pin a message globally */
    ChatClient.prototype.pinMessage = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MESSAGES).concat(messageId, "/pin/"), {
                            method: 'POST',
                            headers: { Authorization: "Bearer ".concat(this.authToken) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('pinMessage failed');
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /** Unpin a message globally */
    ChatClient.prototype.unpinMessage = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.MESSAGES).concat(messageId, "/unpin/"), {
                            method: 'DELETE',
                            headers: { Authorization: "Bearer ".concat(this.authToken) },
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('unpinMessage failed');
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Create a poll option */
    ChatClient.prototype.createPollOption = function (pollId, option) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)("".concat(constants_1.API.POLLS).concat(pollId, "/options/"), {
                            method: 'POST',
                            headers: __assign({ 'Content-Type': 'application/json' }, (this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {})),
                            body: JSON.stringify(option),
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('createPollOption failed');
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /** Recover state after a lost connection */
    ChatClient.prototype.recoverStateOnReconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, data, chans;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.RECOVER_STATE, {
                            headers: this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {},
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('recoverStateOnReconnect failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        chans = data.rooms.map(function (r) { var _a; return new Channel_1.Channel(r.id, r.uuid, (_a = r.name) !== null && _a !== void 0 ? _a : r.uuid, _this, r.data || {}); });
                        this.stateStore._set({ channels: chans });
                        this.notifications.store._set({ notifications: data.notifications });
                        return [2 /*return*/, { channels: chans, notifications: data.notifications }];
                }
            });
        });
    };
    /** create / retrieve single channel for <Channel channel={…}> */
    ChatClient.prototype.channel = function (_, roomUuid) {
        return new Channel_1.Channel(0, roomUuid, roomUuid, this, {});
    };
    /** Return this client instance */
    ChatClient.prototype.getClient = function () {
        return this;
    };
    /**
     * Return a slice of the provided array.
     * This mirrors TypedArray.subarray from Stream's SDK.
     */
    ChatClient.prototype.subarray = function (arr, start, end) {
        return __awaiter(this, void 0, void 0, function () {
            var res, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, api_1.apiFetch)(constants_1.API.SUBARRAY, {
                            method: 'POST',
                            headers: __assign({ 'Content-Type': 'application/json' }, (this.jwt ? { Authorization: "Bearer ".concat(this.authToken) } : {})),
                            body: JSON.stringify({ array: arr, start: start, end: end }),
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res.ok)
                            throw new Error('subarray failed');
                        return [4 /*yield*/, res.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data.result];
                }
            });
        });
    };
    return ChatClient;
}());
exports.ChatClient = ChatClient;
