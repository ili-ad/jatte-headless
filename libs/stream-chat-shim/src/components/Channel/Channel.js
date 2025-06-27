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
var module_1 = require();
from;
'stream-chat';
useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
;
from;
'react';
var clsx_1 = require("clsx");
var lodash_debounce_1 = require("lodash.debounce");
var lodash_defaultsdeep_1 = require("lodash.defaultsdeep");
var lodash_throttle_1 = require("lodash.throttle");
var stream_chat_1 = require("stream-chat");
var channelState_1 = require("./channelState");
var useCreateChannelStateContext_1 = require("./hooks/useCreateChannelStateContext");
var useCreateTypingContext_1 = require("./hooks/useCreateTypingContext");
var useEditMessageHandler_1 = require("./hooks/useEditMessageHandler");
var useIsMounted_1 = require("./hooks/useIsMounted");
var useMentionsHandlers_1 = require("./hooks/useMentionsHandlers");
var Loading_1 = require("../Loading");
var LoadingChannel_1 = require("./LoadingChannel");
var context_1 = require("../../context");
var constants_1 = require("./constants");
var limits_1 = require("../../constants/limits");
var MessageList_1 = require("../MessageList");
var useChannelContainerClasses_1 = require("./hooks/useChannelContainerClasses");
var utils_1 = require("./utils");
var Threads_1 = require("../Threads");
var utils_2 = require("../../utils");
var attachment_sizing_1 = require("../Attachment/attachment-sizing");
var hooks_1 = require("../../experimental/Search/hooks");
var ChannelContainer = function (_a) {
    var children = _a.children, additionalClassName = _a.className, props = __rest(_a, ["children", "className"]);
    var _b = (0, context_1.useChatContext)('Channel'), customClasses = _b.customClasses, theme = _b.theme;
    var _c = (0, useChannelContainerClasses_1.useChannelContainerClasses)({
        customClasses: customClasses,
    }), channelClass = _c.channelClass, chatClass = _c.chatClass;
    var className = (0, clsx_1.default)(chatClass, theme, channelClass, additionalClassName);
    return (<div id={constants_1.CHANNEL_CONTAINER_ID} {...props} className={className}>
      {children}
    </div>);
};
var UnMemoizedChannel = function (props) {
    var propsChannel = props.channel, _a = props.EmptyPlaceholder, EmptyPlaceholder = _a === void 0 ? null : _a, LoadingErrorIndicator = props.LoadingErrorIndicator, _b = props.LoadingIndicator, LoadingIndicator = _b === void 0 ? LoadingChannel_1.LoadingChannel : _b;
    var _c = (0, context_1.useChatContext)('Channel'), contextChannel = _c.channel, channelsQueryState = _c.channelsQueryState;
    var channel = propsChannel || contextChannel;
    if (channelsQueryState.queryInProgress === 'reload' && LoadingIndicator) {
        return (<ChannelContainer>
        <LoadingIndicator />
      </ChannelContainer>);
    }
    if (channelsQueryState.error && LoadingErrorIndicator) {
        return (<ChannelContainer>
        <LoadingErrorIndicator error={channelsQueryState.error}/>
      </ChannelContainer>);
    }
    if (!(channel === null || channel === void 0 ? void 0 : channel.cid)) {
        return <ChannelContainer>{EmptyPlaceholder}</ChannelContainer>;
    }
    return <ChannelInner {...props} channel={channel} key={channel.cid}/>;
};
var ChannelInner = function (props) {
    var _a;
    var activeUnreadHandler = props.activeUnreadHandler, channel = props.channel, propChannelQueryOptions = props.channelQueryOptions, children = props.children, doDeleteMessageRequest = props.doDeleteMessageRequest, doMarkReadRequest = props.doMarkReadRequest, doSendMessageRequest = props.doSendMessageRequest, doUpdateMessageRequest = props.doUpdateMessageRequest, _b = props.initializeOnMount, initializeOnMount = _b === void 0 ? true : _b, _c = props.LoadingErrorIndicator, LoadingErrorIndicator = _c === void 0 ? Loading_1.LoadingErrorIndicator : _c, _d = props.LoadingIndicator, LoadingIndicator = _d === void 0 ? LoadingChannel_1.LoadingChannel : _d, _e = props.markReadOnMount, markReadOnMount = _e === void 0 ? true : _e, onMentionsClick = props.onMentionsClick, onMentionsHover = props.onMentionsHover, skipMessageDataMemoization = props.skipMessageDataMemoization;
    var channelQueryOptions = useMemo(function () {
        return (0, lodash_defaultsdeep_1.default)(propChannelQueryOptions, {
            messages: { limit: limits_1.DEFAULT_INITIAL_CHANNEL_PAGE_SIZE },
        });
    }, [propChannelQueryOptions]);
    var _f = (0, context_1.useChatContext)('Channel'), client = _f.client, customClasses = _f.customClasses, latestMessageDatesByChannels = _f.latestMessageDatesByChannels, mutes = _f.mutes, searchController = _f.searchController;
    var t = (0, context_1.useTranslationContext)('Channel').t;
    var chatContainerClass = (0, useChannelContainerClasses_1.getChatContainerClass)(customClasses === null || customClasses === void 0 ? void 0 : customClasses.chatContainer);
    var windowsEmojiClass = (0, useChannelContainerClasses_1.useImageFlagEmojisOnWindowsClass)();
    var thread = (0, Threads_1.useThreadContext)();
    var _g = useState(channel.getConfig()), channelConfig = _g[0], setChannelConfig = _g[1];
    var _h = useState([]), notifications = _h[0], setNotifications = _h[1];
    var notificationTimeouts = useRef([]);
    var _j = useState(), channelUnreadUiState = _j[0], _setChannelUnreadUiState = _j[1];
    var channelReducer = useMemo(function () { return (0, channelState_1.makeChannelReducer)(); }, []);
    var _k = useReducer(channelReducer, __assign(__assign({}, channelState_1.initialState), { hasMore: channel.state.messagePagination.hasPrev, loading: !channel.initialized, messages: channel.state.messages })), state = _k[0], dispatch = _k[1];
    var jumpToMessageFromSearch = (0, hooks_1.useSearchFocusedMessage)();
    var isMounted = (0, useIsMounted_1.useIsMounted)();
    var originalTitle = useRef('');
    var lastRead = useRef(undefined);
    var online = useRef(true);
    var clearHighlightedMessageTimeoutId = useRef(null);
    var channelCapabilitiesArray = (_a = channel.data) === null || _a === void 0 ? void 0 : _a.own_capabilities;
    var throttledCopyStateFromChannel = (0, lodash_throttle_1.default)(function () { return dispatch({ channel: channel, type: 'copyStateFromChannelOnEvent' }); }, 500, {
        leading: true,
        trailing: true,
    });
    var setChannelUnreadUiState = useMemo(function () {
        return (0, lodash_throttle_1.default)(_setChannelUnreadUiState, 200, {
            leading: true,
            trailing: false,
        });
    }, []);
    var markRead = useMemo(function () {
        return (0, lodash_throttle_1.default)(function (options) { return __awaiter(void 0, void 0, void 0, function () {
            var _a, updateChannelUiUnreadState;
            return __generator(this, function (_b) {
                _a = (options !== null && options !== void 0 ? options : {}).updateChannelUiUnreadState, updateChannelUiUnreadState = _a === void 0 ? true : _a;
                if (channel.disconnected || !(channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig.read_events)) {
                    return [2 /*return*/];
                }
                lastRead.current = new Date();
                try {
                    if (doMarkReadRequest) {
                        doMarkReadRequest(channel, updateChannelUiUnreadState ? setChannelUnreadUiState : undefined);
                    }
                    else {
                        if (updateChannelUiUnreadState && markReadResponse) {
                            _setChannelUnreadUiState({
                                last_read: lastRead.current,
                                last_read_message_id: markReadResponse.event.last_read_message_id,
                                unread_messages: 0,
                            });
                        }
                    }
                    if (activeUnreadHandler) {
                        activeUnreadHandler(0, originalTitle.current);
                    }
                    else if (originalTitle.current) {
                        document.title = originalTitle.current;
                    }
                }
                catch (e) {
                    console.error(t('Failed to mark channel as read'));
                }
                return [2 /*return*/];
            });
        }); }, 500, { leading: true, trailing: false });
    }, [
        activeUnreadHandler,
        channel,
        channelConfig,
        doMarkReadRequest,
        setChannelUnreadUiState,
        t,
    ]);
    var handleEvent = function (event) { return __awaiter(void 0, void 0, void 0, function () {
        var mainChannelUpdated, unread, messageDate, cid, oldestID;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    if (event.message) {
                        dispatch({
                            channel: channel,
                            message: event.message,
                            type: 'updateThreadOnEvent',
                        });
                    }
                    if (event.type === 'user.watching.start' || event.type === 'user.watching.stop')
                        return [2 /*return*/];
                    if (event.type === 'typing.start' || event.type === 'typing.stop') {
                        return [2 /*return*/, dispatch({ channel: channel, type: 'setTyping' })];
                    }
                    if (event.type === 'connection.changed' && typeof event.online === 'boolean') {
                        online.current = event.online;
                    }
                    if (event.type === 'message.new') {
                        mainChannelUpdated = !((_a = event.message) === null || _a === void 0 ? void 0 : _a.parent_id) || ((_b = event.message) === null || _b === void 0 ? void 0 : _b.show_in_channel);
                        if (mainChannelUpdated) {
                            if (document.hidden &&
                                (channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig.read_events) &&
                                !channel.muteStatus().muted) {
                                unread = channel.countUnread(lastRead.current);
                                if (activeUnreadHandler) {
                                    activeUnreadHandler(unread, originalTitle.current);
                                }
                                else {
                                    document.title = "(".concat(unread, ") ").concat(originalTitle.current);
                                }
                            }
                        }
                        if (((_d = (_c = event.message) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.id) === client.userID &&
                            ((_e = event === null || event === void 0 ? void 0 : event.message) === null || _e === void 0 ? void 0 : _e.created_at) &&
                            ((_f = event === null || event === void 0 ? void 0 : event.message) === null || _f === void 0 ? void 0 : _f.cid)) {
                            messageDate = new Date(event.message.created_at);
                            cid = event.message.cid;
                            if (!latestMessageDatesByChannels[cid] ||
                                latestMessageDatesByChannels[cid].getTime() < messageDate.getTime()) {
                                latestMessageDatesByChannels[cid] = messageDate;
                            }
                        }
                    }
                    if (!(event.type === 'user.deleted')) return [3 /*break*/, 2];
                    oldestID = (_j = (_h = (_g = channel.state) === null || _g === void 0 ? void 0 : _g.messages) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.id;
                    /**
                     * As the channel state is not normalized we re-fetch the channel data. Thus, we avoid having to search for user references in the channel state.
                     */
                    // FIXME: we should use channelQueryOptions if they are available
                    return [4 /*yield*/, channel.query({
                            messages: { id_lt: oldestID, limit: limits_1.DEFAULT_NEXT_CHANNEL_PAGE_SIZE },
                            watchers: { limit: limits_1.DEFAULT_NEXT_CHANNEL_PAGE_SIZE },
                        })];
                case 1:
                    /**
                     * As the channel state is not normalized we re-fetch the channel data. Thus, we avoid having to search for user references in the channel state.
                     */
                    // FIXME: we should use channelQueryOptions if they are available
                    _k.sent();
                    _k.label = 2;
                case 2:
                    if (event.type === 'notification.mark_unread')
                        _setChannelUnreadUiState(function (prev) {
                            var _a;
                            if (!(event.last_read_at && event.user))
                                return prev;
                            return {
                                first_unread_message_id: event.first_unread_message_id,
                                last_read: new Date(event.last_read_at),
                                last_read_message_id: event.last_read_message_id,
                                unread_messages: (_a = event.unread_messages) !== null && _a !== void 0 ? _a : 0,
                            };
                        });
                    if (event.type === 'channel.truncated' && event.cid === channel.cid) {
                        _setChannelUnreadUiState(undefined);
                    }
                    throttledCopyStateFromChannel();
                    return [2 /*return*/];
            }
        });
    }); };
    // useLayoutEffect here to prevent spinner. Use Suspense when it is available in stable release
    useLayoutEffect(function () {
        var errored = false;
        var done = false;
        (function () { return __awaiter(void 0, void 0, void 0, function () {
            var members, _i, _a, member, userId, _b, user, user_id, config, e_1, _c, user, ownReadState;
            var _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!(!channel.initialized && initializeOnMount)) return [3 /*break*/, 4];
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 3, , 4]);
                        members = [];
                        if (!channel.id && ((_d = channel.data) === null || _d === void 0 ? void 0 : _d.members)) {
                            for (_i = 0, _a = channel.data.members; _i < _a.length; _i++) {
                                member = _a[_i];
                                userId = void 0;
                                if (typeof member === 'string') {
                                    userId = member;
                                }
                                else if (typeof member === 'object') {
                                    _b = member, user = _b.user, user_id = _b.user_id;
                                    userId = user_id || (user === null || user === void 0 ? void 0 : user.id);
                                }
                                if (userId) {
                                    members.push(userId);
                                }
                            }
                        }
                        return [4 /*yield*/, (0, utils_2.getChannel)({ channel: channel, client: client, members: members, options: channelQueryOptions })];
                    case 2:
                        _f.sent();
                        config = channel.getConfig();
                        setChannelConfig(config);
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _f.sent();
                        dispatch({ error: e_1, type: 'setError' });
                        errored = true;
                        return [3 /*break*/, 4];
                    case 4:
                        done = true;
                        originalTitle.current = document.title;
                        if (!errored) {
                            dispatch({
                                channel: channel,
                                hasMore: channel.state.messagePagination.hasPrev,
                                type: 'initStateFromChannel',
                            });
                            if (((_e = client.user) === null || _e === void 0 ? void 0 : _e.id) && channel.state.read[client.user.id]) {
                                _c = channel.state.read[client.user.id], user = _c.user, ownReadState = __rest(_c, ["user"]);
                                _setChannelUnreadUiState(ownReadState);
                            }
                            /**
                             * TODO: maybe pass last_read to the countUnread method to get proper value
                             * combined with channel.countUnread adjustment (_countMessageAsUnread)
                             * to allow counting own messages too
                             *
                             * const lastRead = channel.state.read[client.userID as string].last_read;
                             */
                            if (channel.countUnread() > 0 && markReadOnMount)
                                markRead({ updateChannelUiUnreadState: false });
                            // The more complex sync logic is done in Chat
                            client.on('connection.changed', handleEvent);
                            client.on('connection.recovered', handleEvent);
                            client.on('user.updated', handleEvent);
                            client.on('user.deleted', handleEvent);
                            channel.on(handleEvent);
                        }
                        return [2 /*return*/];
                }
            });
        }); })();
        var notificationTimeoutsRef = notificationTimeouts.current;
        return function () {
            if (errored || !done)
                return;
            channel === null || channel === void 0 ? void 0 : channel.off(handleEvent);
            client.off('connection.changed', handleEvent);
            client.off('connection.recovered', handleEvent);
            client.off('user.deleted', handleEvent);
            notificationTimeoutsRef.forEach(clearTimeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        channel.cid,
        channelQueryOptions,
        doMarkReadRequest,
        channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig.read_events,
        initializeOnMount,
    ]);
    useEffect(function () {
        var _a;
        if (!state.thread)
            return;
        var message = (_a = state.messages) === null || _a === void 0 ? void 0 : _a.find(function (m) { var _a; return m.id === ((_a = state.thread) === null || _a === void 0 ? void 0 : _a.id); });
        if (message)
            dispatch({ message: message, type: 'setThread' });
    }, [state.messages, state.thread]);
    var handleHighlightedMessageChange = useCallback(function (_a) {
        var highlightDuration = _a.highlightDuration, highlightedMessageId = _a.highlightedMessageId;
        dispatch({
            channel: channel,
            highlightedMessageId: highlightedMessageId,
            type: 'jumpToMessageFinished',
        });
        if (clearHighlightedMessageTimeoutId.current) {
            clearTimeout(clearHighlightedMessageTimeoutId.current);
        }
        clearHighlightedMessageTimeoutId.current = setTimeout(function () {
            if (searchController._internalState.getLatestValue().focusedMessage) {
                searchController._internalState.partialNext({ focusedMessage: undefined });
            }
            clearHighlightedMessageTimeoutId.current = null;
            dispatch({ type: 'clearHighlightedMessage' });
        }, highlightDuration !== null && highlightDuration !== void 0 ? highlightDuration : limits_1.DEFAULT_HIGHLIGHT_DURATION);
    }, [channel, searchController]);
    useEffect(function () {
        if (!(jumpToMessageFromSearch === null || jumpToMessageFromSearch === void 0 ? void 0 : jumpToMessageFromSearch.id))
            return;
        handleHighlightedMessageChange({ highlightedMessageId: jumpToMessageFromSearch.id });
    }, [jumpToMessageFromSearch, handleHighlightedMessageChange]);
    /** MESSAGE */
    // Adds a temporary notification to message list, will be removed after 5 seconds
    var addNotification = useMemo(function () { return (0, utils_1.makeAddNotifications)(setNotifications, notificationTimeouts.current); }, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    var loadMoreFinished = useCallback((0, lodash_debounce_1.default)(function (hasMore, messages) {
        if (!isMounted.current)
            return;
        dispatch({ hasMore: hasMore, messages: messages, type: 'loadMoreFinished' });
    }, 2000, { leading: true, trailing: true }), []);
    var loadMore = function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (limit) {
            var oldestMessage, oldestID, perPage, queryResponse, e_2;
            var _a;
            if (limit === void 0) { limit = limits_1.DEFAULT_NEXT_CHANNEL_PAGE_SIZE; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!online.current ||
                            !window.navigator.onLine ||
                            !channel.state.messagePagination.hasPrev)
                            return [2 /*return*/, 0];
                        oldestMessage = (_a = state === null || state === void 0 ? void 0 : state.messages) === null || _a === void 0 ? void 0 : _a[0];
                        if (state.loadingMore ||
                            state.loadingMoreNewer ||
                            (oldestMessage === null || oldestMessage === void 0 ? void 0 : oldestMessage.status) !== 'received') {
                            return [2 /*return*/, 0];
                        }
                        dispatch({ loadingMore: true, type: 'setLoadingMore' });
                        oldestID = oldestMessage === null || oldestMessage === void 0 ? void 0 : oldestMessage.id;
                        perPage = limit;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, channel.query({
                                messages: { id_lt: oldestID, limit: perPage },
                                watchers: { limit: perPage },
                            })];
                    case 2:
                        queryResponse = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _b.sent();
                        console.warn('message pagination request failed with error', e_2);
                        dispatch({ loadingMore: false, type: 'setLoadingMore' });
                        return [2 /*return*/, 0];
                    case 4:
                        loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
                        return [2 /*return*/, queryResponse.messages.length];
                }
            });
        });
    };
    var loadMoreNewer = function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (limit) {
            var newestMessage, newestId, perPage, queryResponse, e_3;
            var _a, _b;
            if (limit === void 0) { limit = limits_1.DEFAULT_NEXT_CHANNEL_PAGE_SIZE; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!online.current ||
                            !window.navigator.onLine ||
                            !channel.state.messagePagination.hasNext)
                            return [2 /*return*/, 0];
                        newestMessage = (_a = state === null || state === void 0 ? void 0 : state.messages) === null || _a === void 0 ? void 0 : _a[((_b = state === null || state === void 0 ? void 0 : state.messages) === null || _b === void 0 ? void 0 : _b.length) - 1];
                        if (state.loadingMore || state.loadingMoreNewer)
                            return [2 /*return*/, 0];
                        dispatch({ loadingMoreNewer: true, type: 'setLoadingMoreNewer' });
                        newestId = newestMessage === null || newestMessage === void 0 ? void 0 : newestMessage.id;
                        perPage = limit;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, channel.query({
                                messages: { id_gt: newestId, limit: perPage },
                                watchers: { limit: perPage },
                            })];
                    case 2:
                        queryResponse = _c.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_3 = _c.sent();
                        console.warn('message pagination request failed with error', e_3);
                        dispatch({ loadingMoreNewer: false, type: 'setLoadingMoreNewer' });
                        return [2 /*return*/, 0];
                    case 4:
                        dispatch({
                            hasMoreNewer: channel.state.messagePagination.hasNext,
                            messages: channel.state.messages,
                            type: 'loadMoreNewerFinished',
                        });
                        return [2 /*return*/, queryResponse.messages.length];
                }
            });
        });
    };
    var jumpToMessage = useCallback(function (messageId_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([messageId_1], args_1, true), void 0, function (messageId, messageLimit, highlightDuration) {
            if (messageLimit === void 0) { messageLimit = limits_1.DEFAULT_JUMP_TO_PAGE_SIZE; }
            if (highlightDuration === void 0) { highlightDuration = limits_1.DEFAULT_HIGHLIGHT_DURATION; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dispatch({ loadingMore: true, type: 'setLoadingMore' });
                        return [4 /*yield*/, channel.state.loadMessageIntoState(messageId, undefined, messageLimit)];
                    case 1:
                        _a.sent();
                        loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
                        handleHighlightedMessageChange({
                            highlightDuration: highlightDuration,
                            highlightedMessageId: messageId,
                        });
                        return [2 /*return*/];
                }
            });
        });
    }, [channel, handleHighlightedMessageChange, loadMoreFinished]);
    var jumpToLatestMessage = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channel.state.loadMessageIntoState('latest')];
                case 1:
                    _a.sent();
                    loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
                    dispatch({
                        type: 'jumpToLatestMessage',
                    });
                    return [2 /*return*/];
            }
        });
    }); }, [channel, loadMoreFinished]);
    var jumpToFirstUnreadMessage = useCallback(function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (queryMessageLimit, highlightDuration) {
            var lastReadMessageId, firstUnreadMessageId, isInCurrentMessageSet, result, result, lastReadTimestamp, _a, lastReadMessageIndex, lastReadMessage, messages, e_4, firstMessageWithCreationDate, firstMessageTimestamp, result, targetId_1, indexOfTarget, e_5;
            var _b, _c, _d, _e;
            if (queryMessageLimit === void 0) { queryMessageLimit = limits_1.DEFAULT_JUMP_TO_PAGE_SIZE; }
            if (highlightDuration === void 0) { highlightDuration = limits_1.DEFAULT_HIGHLIGHT_DURATION; }
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!(channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.unread_messages))
                            return [2 /*return*/];
                        lastReadMessageId = channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.last_read_message_id;
                        firstUnreadMessageId = channelUnreadUiState === null || channelUnreadUiState === void 0 ? void 0 : channelUnreadUiState.first_unread_message_id;
                        isInCurrentMessageSet = false;
                        if (!firstUnreadMessageId) return [3 /*break*/, 1];
                        result = (0, utils_1.findInMsgSetById)(firstUnreadMessageId, channel.state.messages);
                        isInCurrentMessageSet = result.index !== -1;
                        return [3 /*break*/, 8];
                    case 1:
                        if (!lastReadMessageId) return [3 /*break*/, 2];
                        result = (0, utils_1.findInMsgSetById)(lastReadMessageId, channel.state.messages);
                        isInCurrentMessageSet = !!result.target;
                        firstUnreadMessageId =
                            result.index > -1 ? (_b = channel.state.messages[result.index + 1]) === null || _b === void 0 ? void 0 : _b.id : undefined;
                        return [3 /*break*/, 8];
                    case 2:
                        lastReadTimestamp = channelUnreadUiState.last_read.getTime();
                        _a = (0, utils_1.findInMsgSetByDate)(channelUnreadUiState.last_read, channel.state.messages, true), lastReadMessageIndex = _a.index, lastReadMessage = _a.target;
                        if (!lastReadMessage) return [3 /*break*/, 3];
                        firstUnreadMessageId = (_c = channel.state.messages[lastReadMessageIndex + 1]) === null || _c === void 0 ? void 0 : _c.id;
                        isInCurrentMessageSet = !!firstUnreadMessageId;
                        lastReadMessageId = lastReadMessage.id;
                        return [3 /*break*/, 8];
                    case 3:
                        dispatch({ loadingMore: true, type: 'setLoadingMore' });
                        messages = void 0;
                        _f.label = 4;
                    case 4:
                        _f.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, channel.query({
                                messages: {
                                    created_at_around: channelUnreadUiState.last_read.toISOString(),
                                    limit: queryMessageLimit,
                                },
                            }, 'new')];
                    case 5:
                        messages = (_f.sent()).messages;
                        return [3 /*break*/, 7];
                    case 6:
                        e_4 = _f.sent();
                        addNotification(t('Failed to jump to the first unread message'), 'error');
                        loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
                        return [2 /*return*/];
                    case 7:
                        firstMessageWithCreationDate = messages.find(function (msg) { return msg.created_at; });
                        if (!firstMessageWithCreationDate) {
                            addNotification(t('Failed to jump to the first unread message'), 'error');
                            loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
                            return [2 /*return*/];
                        }
                        firstMessageTimestamp = new Date(firstMessageWithCreationDate.created_at).getTime();
                        if (lastReadTimestamp < firstMessageTimestamp) {
                            // whole channel is unread
                            firstUnreadMessageId = firstMessageWithCreationDate.id;
                        }
                        else {
                            result = (0, utils_1.findInMsgSetByDate)(channelUnreadUiState.last_read, messages);
                            lastReadMessageId = (_d = result.target) === null || _d === void 0 ? void 0 : _d.id;
                        }
                        loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
                        _f.label = 8;
                    case 8:
                        if (!firstUnreadMessageId && !lastReadMessageId) {
                            addNotification(t('Failed to jump to the first unread message'), 'error');
                            return [2 /*return*/];
                        }
                        if (!!isInCurrentMessageSet) return [3 /*break*/, 12];
                        dispatch({ loadingMore: true, type: 'setLoadingMore' });
                        _f.label = 9;
                    case 9:
                        _f.trys.push([9, 11, , 12]);
                        targetId_1 = (firstUnreadMessageId !== null && firstUnreadMessageId !== void 0 ? firstUnreadMessageId : lastReadMessageId);
                        return [4 /*yield*/, channel.state.loadMessageIntoState(targetId_1, undefined, queryMessageLimit)];
                    case 10:
                        _f.sent();
                        indexOfTarget = channel.state.messages.findIndex(function (message) { return message.id === targetId_1; });
                        loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
                        firstUnreadMessageId =
                            firstUnreadMessageId !== null && firstUnreadMessageId !== void 0 ? firstUnreadMessageId : (_e = channel.state.messages[indexOfTarget + 1]) === null || _e === void 0 ? void 0 : _e.id;
                        return [3 /*break*/, 12];
                    case 11:
                        e_5 = _f.sent();
                        addNotification(t('Failed to jump to the first unread message'), 'error');
                        loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
                        return [2 /*return*/];
                    case 12:
                        if (!firstUnreadMessageId) {
                            addNotification(t('Failed to jump to the first unread message'), 'error');
                            return [2 /*return*/];
                        }
                        if (!channelUnreadUiState.first_unread_message_id)
                            _setChannelUnreadUiState(__assign(__assign({}, channelUnreadUiState), { first_unread_message_id: firstUnreadMessageId, last_read_message_id: lastReadMessageId }));
                        handleHighlightedMessageChange({
                            highlightDuration: highlightDuration,
                            highlightedMessageId: firstUnreadMessageId,
                        });
                        return [2 /*return*/];
                }
            });
        });
    }, [
        addNotification,
        channel,
        handleHighlightedMessageChange,
        loadMoreFinished,
        t,
        channelUnreadUiState,
    ]);
    var deleteMessage = useCallback(function (message) { return __awaiter(void 0, void 0, void 0, function () {
        var deletedMessage, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(message === null || message === void 0 ? void 0 : message.id)) {
                        throw new Error('Cannot delete a message - missing message ID.');
                    }
                    if (!doDeleteMessageRequest) return [3 /*break*/, 2];
                    return [4 /*yield*/, doDeleteMessageRequest(message)];
                case 1:
                    deletedMessage = _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, client.deleteMessage(message.id)];
                case 3:
                    result = _a.sent();
                    deletedMessage = result.message;
                    _a.label = 4;
                case 4: return [2 /*return*/, deletedMessage];
            }
        });
    }); }, [client, doDeleteMessageRequest]);
    var updateMessage = function (updatedMessage) {
        // add the message to the local channel state
        channel.state.addMessageSorted(updatedMessage, true);
        dispatch({
            channel: channel,
            parentId: state.thread && updatedMessage.parent_id,
            type: 'copyMessagesFromChannel',
        });
    };
    var doSendMessage = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var messageResponse, existingMessage, i, msg, responseTimestamp, existingMessageTimestamp, responseIsTheNewest, error_1, stringError, parsedError;
        var _c, _d;
        var localMessage = _b.localMessage, message = _b.message, options = _b.options;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 5, , 6]);
                    messageResponse = void 0;
                    if (!doSendMessageRequest) return [3 /*break*/, 2];
                    return [4 /*yield*/, doSendMessageRequest(channel, message, options)];
                case 1:
                    messageResponse = _e.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, Promise.resolve(undefined)];
                case 3:
                    _e.sent();
                    _e.label = 4;
                case 4:
                    existingMessage = undefined;
                    for (i = channel.state.messages.length - 1; i >= 0; i--) {
                        msg = channel.state.messages[i];
                        if (msg.id && msg.id === message.id) {
                            existingMessage = msg;
                            break;
                        }
                    }
                    responseTimestamp = new Date(((_c = messageResponse === null || messageResponse === void 0 ? void 0 : messageResponse.message) === null || _c === void 0 ? void 0 : _c.updated_at) || 0).getTime();
                    existingMessageTimestamp = ((_d = existingMessage === null || existingMessage === void 0 ? void 0 : existingMessage.updated_at) === null || _d === void 0 ? void 0 : _d.getTime()) || 0;
                    responseIsTheNewest = responseTimestamp > existingMessageTimestamp;
                    // Replace the message payload after send is completed
                    // We need to check for the newest message payload, because on slow network, the response can arrive later than WS events message.new, message.updated.
                    // Always override existing message in status "sending"
                    if ((messageResponse === null || messageResponse === void 0 ? void 0 : messageResponse.message) &&
                        (responseIsTheNewest || (existingMessage === null || existingMessage === void 0 ? void 0 : existingMessage.status) === 'sending')) {
                        updateMessage(__assign(__assign({}, messageResponse.message), { status: 'received' }));
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _e.sent();
                    stringError = JSON.stringify(error_1);
                    parsedError = (stringError ? JSON.parse(stringError) : {});
                    // Handle the case where the message already exists
                    // (typically, when retrying to send a message).
                    // If the message already exists, we can assume it was sent successfully,
                    // so we update the message status to "received".
                    // Right now, the only way to check this error is by checking
                    // the combination of the error code and the error description,
                    // since there is no special error code for duplicate messages.
                    if (parsedError.code === 4 &&
                        error_1 instanceof Error &&
                        error_1.message.includes('already exists')) {
                        updateMessage(__assign(__assign({}, localMessage), { status: 'received' }));
                    }
                    else {
                        updateMessage(__assign(__assign({}, localMessage), { error: parsedError, status: 'failed' }));
                        thread === null || thread === void 0 ? void 0 : thread.upsertReplyLocally({
                            message: __assign(__assign({}, localMessage), { error: parsedError, status: 'failed' }),
                        });
                    }
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var sendMessage = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var localMessage = _b.localMessage, message = _b.message, options = _b.options;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channel.state.filterErrorMessages();
                    thread === null || thread === void 0 ? void 0 : thread.upsertReplyLocally({
                        message: localMessage,
                    });
                    updateMessage(localMessage);
                    return [4 /*yield*/, doSendMessage({ localMessage: localMessage, message: message, options: options })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var retrySendMessage = function (localMessage) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    updateMessage(__assign(__assign({}, localMessage), { error: undefined, status: 'sending' }));
                    return [4 /*yield*/, doSendMessage({
                            localMessage: localMessage,
                            message: (0, stream_chat_1.localMessageToNewMessagePayload)(localMessage),
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var removeMessage = function (message) {
        channel.state.removeMessage(message);
        dispatch({
            channel: channel,
            parentId: state.thread && message.parent_id,
            type: 'copyMessagesFromChannel',
        });
    };
    /** THREAD */
    var openThread = function (message, event) {
        event === null || event === void 0 ? void 0 : event.preventDefault();
        dispatch({ channel: channel, message: message, type: 'openThread' });
    };
    var closeThread = function (event) {
        event === null || event === void 0 ? void 0 : event.preventDefault();
        dispatch({ type: 'closeThread' });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    var loadMoreThreadFinished = useCallback((0, lodash_debounce_1.default)(function (threadHasMore, threadMessages) {
        dispatch({
            threadHasMore: threadHasMore,
            threadMessages: threadMessages,
            type: 'loadMoreThreadFinished',
        });
    }, 2000, { leading: true, trailing: true }), []);
    var loadMoreThread = function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (limit) {
            var parentId, oldMessages, oldestMessageId, queryResponse, threadHasMoreMessages, newThreadMessages, e_6;
            var _a;
            if (limit === void 0) { limit = limits_1.DEFAULT_THREAD_PAGE_SIZE; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // FIXME: should prevent loading more, if state.thread.reply_count === channel.state.threads[parentID].length
                        if (state.threadLoadingMore || !state.thread || !state.threadHasMore)
                            return [2 /*return*/];
                        dispatch({ type: 'startLoadingThread' });
                        parentId = state.thread.id;
                        if (!parentId) {
                            return [2 /*return*/, dispatch({ type: 'closeThread' })];
                        }
                        oldMessages = channel.state.threads[parentId] || [];
                        oldestMessageId = (_a = oldMessages[0]) === null || _a === void 0 ? void 0 : _a.id;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, channel.getReplies(parentId, {
                                id_lt: oldestMessageId,
                                limit: limit,
                            })];
                    case 2:
                        queryResponse = _b.sent();
                        threadHasMoreMessages = (0, MessageList_1.hasMoreMessagesProbably)(queryResponse.messages.length, limit);
                        newThreadMessages = channel.state.threads[parentId] || [];
                        // next set loadingMore to false so we can start asking for more data
                        loadMoreThreadFinished(threadHasMoreMessages, newThreadMessages);
                        return [3 /*break*/, 4];
                    case 3:
                        e_6 = _b.sent();
                        loadMoreThreadFinished(false, oldMessages);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    var onMentionsHoverOrClick = (0, useMentionsHandlers_1.useMentionsHandlers)(onMentionsHover, onMentionsClick);
    var editMessage = (0, useEditMessageHandler_1.useEditMessageHandler)(doUpdateMessageRequest);
    var typing = state.typing, restState = __rest(state, ["typing"]);
    var channelStateContextValue = (0, useCreateChannelStateContext_1.useCreateChannelStateContext)(__assign(__assign({}, restState), { channel: channel, channelCapabilitiesArray: channelCapabilitiesArray, channelConfig: channelConfig, channelUnreadUiState: channelUnreadUiState, giphyVersion: props.giphyVersion || 'fixed_height', imageAttachmentSizeHandler: props.imageAttachmentSizeHandler || attachment_sizing_1.getImageAttachmentConfiguration, mutes: mutes, notifications: notifications, shouldGenerateVideoThumbnail: props.shouldGenerateVideoThumbnail || true, videoAttachmentSizeHandler: props.videoAttachmentSizeHandler || attachment_sizing_1.getVideoAttachmentConfiguration, watcher_count: state.watcherCount }));
    var channelActionContextValue = useMemo(function () { return ({
        addNotification: addNotification,
        closeThread: closeThread,
        deleteMessage: deleteMessage,
        dispatch: dispatch,
        editMessage: editMessage,
        jumpToFirstUnreadMessage: jumpToFirstUnreadMessage,
        jumpToLatestMessage: jumpToLatestMessage,
        jumpToMessage: jumpToMessage,
        loadMore: loadMore,
        loadMoreNewer: loadMoreNewer,
        loadMoreThread: loadMoreThread,
        markRead: markRead,
        onMentionsClick: onMentionsHoverOrClick,
        onMentionsHover: onMentionsHoverOrClick,
        openThread: openThread,
        removeMessage: removeMessage,
        retrySendMessage: retrySendMessage,
        sendMessage: sendMessage,
        setChannelUnreadUiState: setChannelUnreadUiState,
        skipMessageDataMemoization: skipMessageDataMemoization,
        updateMessage: updateMessage,
    }); }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        channel.cid,
        deleteMessage,
        loadMore,
        loadMoreNewer,
        markRead,
        jumpToFirstUnreadMessage,
        jumpToMessage,
        jumpToLatestMessage,
        setChannelUnreadUiState,
    ]);
    var componentContextValue = useMemo(function () { return ({
        Attachment: props.Attachment,
        AttachmentPreviewList: props.AttachmentPreviewList,
        AttachmentSelector: props.AttachmentSelector,
        AttachmentSelectorInitiationButtonContents: props.AttachmentSelectorInitiationButtonContents,
        AudioRecorder: props.AudioRecorder,
        AutocompleteSuggestionItem: props.AutocompleteSuggestionItem,
        AutocompleteSuggestionList: props.AutocompleteSuggestionList,
        Avatar: props.Avatar,
        BaseImage: props.BaseImage,
        CooldownTimer: props.CooldownTimer,
        CustomMessageActionsList: props.CustomMessageActionsList,
        DateSeparator: props.DateSeparator,
        EditMessageInput: props.EditMessageInput,
        EmojiPicker: props.EmojiPicker,
        emojiSearchIndex: props.emojiSearchIndex,
        EmptyStateIndicator: props.EmptyStateIndicator,
        FileUploadIcon: props.FileUploadIcon,
        GiphyPreviewMessage: props.GiphyPreviewMessage,
        HeaderComponent: props.HeaderComponent,
        Input: props.Input,
        LinkPreviewList: props.LinkPreviewList,
        LoadingIndicator: props.LoadingIndicator,
        Message: props.Message,
        MessageActions: props.MessageActions,
        MessageBlocked: props.MessageBlocked,
        MessageBouncePrompt: props.MessageBouncePrompt,
        MessageDeleted: props.MessageDeleted,
        MessageIsThreadReplyInChannelButtonIndicator: props.MessageIsThreadReplyInChannelButtonIndicator,
        MessageListNotifications: props.MessageListNotifications,
        MessageNotification: props.MessageNotification,
        MessageOptions: props.MessageOptions,
        MessageRepliesCountButton: props.MessageRepliesCountButton,
        MessageStatus: props.MessageStatus,
        MessageSystem: props.MessageSystem,
        MessageTimestamp: props.MessageTimestamp,
        ModalGallery: props.ModalGallery,
        PinIndicator: props.PinIndicator,
        PollActions: props.PollActions,
        PollContent: props.PollContent,
        PollCreationDialog: props.PollCreationDialog,
        PollHeader: props.PollHeader,
        PollOptionSelector: props.PollOptionSelector,
        QuotedMessage: props.QuotedMessage,
        QuotedMessagePreview: props.QuotedMessagePreview,
        QuotedPoll: props.QuotedPoll,
        reactionOptions: props.reactionOptions,
        ReactionSelector: props.ReactionSelector,
        ReactionsList: props.ReactionsList,
        ReactionsListModal: props.ReactionsListModal,
        ReminderNotification: props.ReminderNotification,
        SendButton: props.SendButton,
        SendToChannelCheckbox: props.SendToChannelCheckbox,
        StartRecordingAudioButton: props.StartRecordingAudioButton,
        StopAIGenerationButton: props.StopAIGenerationButton,
        StreamedMessageText: props.StreamedMessageText,
        TextareaComposer: props.TextareaComposer,
        ThreadHead: props.ThreadHead,
        ThreadHeader: props.ThreadHeader,
        ThreadStart: props.ThreadStart,
        Timestamp: props.Timestamp,
        TypingIndicator: props.TypingIndicator,
        UnreadMessagesNotification: props.UnreadMessagesNotification,
        UnreadMessagesSeparator: props.UnreadMessagesSeparator,
        VirtualMessage: props.VirtualMessage,
    }); }, [
        props.Attachment,
        props.AttachmentPreviewList,
        props.AttachmentSelector,
        props.AttachmentSelectorInitiationButtonContents,
        props.AudioRecorder,
        props.AutocompleteSuggestionItem,
        props.AutocompleteSuggestionList,
        props.Avatar,
        props.BaseImage,
        props.CooldownTimer,
        props.CustomMessageActionsList,
        props.DateSeparator,
        props.EditMessageInput,
        props.EmojiPicker,
        props.emojiSearchIndex,
        props.EmptyStateIndicator,
        props.FileUploadIcon,
        props.GiphyPreviewMessage,
        props.HeaderComponent,
        props.Input,
        props.LinkPreviewList,
        props.LoadingIndicator,
        props.Message,
        props.MessageActions,
        props.MessageBlocked,
        props.MessageBouncePrompt,
        props.MessageDeleted,
        props.MessageIsThreadReplyInChannelButtonIndicator,
        props.MessageListNotifications,
        props.MessageNotification,
        props.MessageOptions,
        props.MessageRepliesCountButton,
        props.MessageStatus,
        props.MessageSystem,
        props.MessageTimestamp,
        props.ModalGallery,
        props.PinIndicator,
        props.PollActions,
        props.PollContent,
        props.PollCreationDialog,
        props.PollHeader,
        props.PollOptionSelector,
        props.QuotedMessage,
        props.QuotedMessagePreview,
        props.QuotedPoll,
        props.reactionOptions,
        props.ReactionSelector,
        props.ReactionsList,
        props.ReactionsListModal,
        props.ReminderNotification,
        props.SendButton,
        props.SendToChannelCheckbox,
        props.StartRecordingAudioButton,
        props.StopAIGenerationButton,
        props.StreamedMessageText,
        props.TextareaComposer,
        props.ThreadHead,
        props.ThreadHeader,
        props.ThreadStart,
        props.Timestamp,
        props.TypingIndicator,
        props.UnreadMessagesNotification,
        props.UnreadMessagesSeparator,
        props.VirtualMessage,
    ]);
    var typingContextValue = (0, useCreateTypingContext_1.useCreateTypingContext)({
        typing: typing,
    });
    if (state.error) {
        return (<ChannelContainer>
        <LoadingErrorIndicator error={state.error}/>
      </ChannelContainer>);
    }
    if (state.loading) {
        return (<ChannelContainer>
        <LoadingIndicator />
      </ChannelContainer>);
    }
    if (!channel.watch) {
        return (<ChannelContainer>
        <div>{t('Channel Missing')}</div>
      </ChannelContainer>);
    }
    return (<ChannelContainer className={windowsEmojiClass}>
      <context_1.ChannelStateProvider value={channelStateContextValue}>
        <context_1.ChannelActionProvider value={channelActionContextValue}>
          <context_1.WithComponents overrides={componentContextValue}>
            <context_1.TypingProvider value={typingContextValue}>
              <div className={(0, clsx_1.default)(chatContainerClass)}>{children}</div>
            </context_1.TypingProvider>
          </context_1.WithComponents>
        </context_1.ChannelActionProvider>
      </context_1.ChannelStateProvider>
    </ChannelContainer>);
};
/**
 * A wrapper component that provides channel data and renders children.
 * The Channel component provides the following contexts:
 * - [ChannelStateContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_state_context/)
 * - [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/)
 * - [ComponentContext](https://getstream.io/chat/docs/sdk/react/contexts/component_context/)
 * - [TypingContext](https://getstream.io/chat/docs/sdk/react/contexts/typing_context/)
 */
exports.Channel = module_1.default.memo(UnMemoizedChannel);
