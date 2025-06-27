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
exports.buildMessageComposer = void 0;
/* composer/index.ts */
var MiniStore_1 = require("../MiniStore");
var text_1 = require("./text");
var attachments_1 = require("./attachments");
var polls_1 = require("./polls");
var constants_1 = require("../constants");
var buildMessageComposer = function (channelRef) {
    var roomKey = "draft:".concat(channelRef.cid);
    var textComposer = (0, text_1.buildTextComposer)();
    return {
        contextType: 'message', tag: 'root',
        attachmentManager: (0, attachments_1.buildAttachmentManager)({ jwt: channelRef.client['jwt'] }),
        pollComposer: (0, polls_1.buildPollComposer)(channelRef.client),
        customDataManager: {
            state: new MiniStore_1.MiniStore({ customData: {} }),
            set: function (k, v) {
                var _a;
                var cur = this.state.getSnapshot().customData;
                this.state._set({ customData: __assign(__assign({}, cur), (_a = {}, _a[k] = v, _a)) });
            },
            clear: function () { this.state._set({ customData: {} }); },
        },
        state: new MiniStore_1.MiniStore({ quotedMessage: undefined }),
        linkPreviewsManager: (function () {
            var store = new MiniStore_1.MiniStore({ previews: [] });
            return {
                state: store,
                add: function (url) {
                    return __awaiter(this, void 0, void 0, function () {
                        var res, preview, list;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fetch(constants_1.API.LINK_PREVIEW, {
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
                clear: function () { store._set({ previews: [] }); },
            };
        })(),
        textComposer: textComposer,
        /* simple proxies */
        get compositionIsEmpty() { return textComposer.state.getSnapshot().text.trim() === ''; },
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
                    text = textComposer.state.getSnapshot().text.trim();
                    now = new Date().toISOString();
                    localMessage = {
                        id: "local-".concat(Date.now()),
                        text: text,
                        user_id: userId,
                        created_at: now,
                    };
                    return [2 /*return*/, { localMessage: localMessage, message: localMessage, sendOptions: {} }];
                });
            });
        },
        sendMessage: function (_loc, msg) {
            return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, channelRef.sendMessage({ text: msg.text })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            }); });
        },
        submit: function () { textComposer.clear(); /* will be wired in Channel.ts*/ },
        /* Stream-UI housekeeping */
        registerSubscriptions: function () { return function () { }; },
        createDraft: function () { localStorage.setItem(roomKey, textComposer.state.getSnapshot().text); },
        discardDraft: function () { localStorage.removeItem(roomKey); },
        configState: new MiniStore_1.MiniStore({ attachments: { acceptedFiles: [], maxNumberOfFilesPerMessage: 10 },
            text: { enabled: true }, multipleUploads: true, isUploadEnabled: true }),
        getInputValue: function () { return textComposer.state.getSnapshot().text; },
        setInputValue: function (v) { textComposer.state._set({ text: v }); },
        reset: function () { textComposer.clear(); },
    };
};
exports.buildMessageComposer = buildMessageComposer;
