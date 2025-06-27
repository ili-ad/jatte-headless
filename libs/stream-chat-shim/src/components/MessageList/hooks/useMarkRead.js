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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMarkRead = void 0;
var react_1 = require("react");
var context_1 = require("../../../context");
var hasReadLastMessage = function (channel, userId) {
    var _a, _b;
    var latestMessageIdInChannel = (_a = channel.state.latestMessages.slice(-1)[0]) === null || _a === void 0 ? void 0 : _a.id;
    var lastReadMessageIdServer = (_b = channel.state.read[userId]) === null || _b === void 0 ? void 0 : _b.last_read_message_id;
    return latestMessageIdInChannel === lastReadMessageIdServer;
};
/**
 * Takes care of marking a channel read. The channel is read only if all the following applies:
 * 1. the message list is not rendered in a thread
 * 2. the message list is scrolled to the bottom
 * 3. the channel was not marked unread by the user
 * @param isMessageListScrolledToBottom
 * @param messageListIsThread
 * @param wasChannelMarkedUnread
 */
var useMarkRead = function (_a) {
    var isMessageListScrolledToBottom = _a.isMessageListScrolledToBottom, messageListIsThread = _a.messageListIsThread, wasMarkedUnread = _a.wasMarkedUnread;
    var client = (0, context_1.useChatContext)('useMarkRead').client;
    var _b = (0, context_1.useChannelActionContext)('useMarkRead'), markRead = _b.markRead, setChannelUnreadUiState = _b.setChannelUnreadUiState;
    var channel = (0, context_1.useChannelStateContext)('useMarkRead').channel;
    (0, react_1.useEffect)(function () {
        var shouldMarkRead = function () {
            var _a;
            return !document.hidden &&
                !wasMarkedUnread &&
                !messageListIsThread &&
                isMessageListScrolledToBottom &&
                ((_a = client.user) === null || _a === void 0 ? void 0 : _a.id) &&
                !hasReadLastMessage(channel, client.user.id);
        };
        var onVisibilityChange = function () {
            if (shouldMarkRead())
                markRead();
        };
        var handleMessageNew = function (event) {
            var _a, _b;
            var mainChannelUpdated = !((_a = event.message) === null || _a === void 0 ? void 0 : _a.parent_id) || ((_b = event.message) === null || _b === void 0 ? void 0 : _b.show_in_channel);
            if (!isMessageListScrolledToBottom || wasMarkedUnread || document.hidden) {
                setChannelUnreadUiState(function (prev) {
                    var _a, _b;
                    var previousUnreadCount = (_a = prev === null || prev === void 0 ? void 0 : prev.unread_messages) !== null && _a !== void 0 ? _a : 0;
                    var previousLastMessage = getPreviousLastMessage(channel.state.messages, event.message);
                    return __assign(__assign({}, (prev || {})), { last_read: (_b = prev === null || prev === void 0 ? void 0 : prev.last_read) !== null && _b !== void 0 ? _b : (previousUnreadCount === 0 && (previousLastMessage === null || previousLastMessage === void 0 ? void 0 : previousLastMessage.created_at)
                            ? new Date(previousLastMessage.created_at)
                            : new Date(0)), unread_messages: previousUnreadCount + 1 });
                });
            }
            else if (mainChannelUpdated && shouldMarkRead()) {
                markRead();
            }
        };
        channel.on('message.new', handleMessageNew);
        document.addEventListener('visibilitychange', onVisibilityChange);
        if (shouldMarkRead()) {
            markRead();
        }
        return function () {
            channel.off('message.new', handleMessageNew);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [
        channel,
        client,
        isMessageListScrolledToBottom,
        markRead,
        messageListIsThread,
        setChannelUnreadUiState,
        wasMarkedUnread,
    ]);
};
exports.useMarkRead = useMarkRead;
function getPreviousLastMessage(messages, newMessage) {
    if (!newMessage)
        return;
    var previousLastMessage;
    for (var i = messages.length - 1; i >= 0; i--) {
        var msg = messages[i];
        if (!(msg === null || msg === void 0 ? void 0 : msg.id))
            break;
        if (msg.id !== newMessage.id) {
            previousLastMessage = msg;
            break;
        }
    }
    return previousLastMessage;
}
