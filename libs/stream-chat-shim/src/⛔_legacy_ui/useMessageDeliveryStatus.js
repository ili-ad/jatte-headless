"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMessageDeliveryStatus = exports.MessageDeliveryStatus = void 0;
var react_1 = require("react");
/** Delivery states for a sent message. */
var MessageDeliveryStatus;
(function (MessageDeliveryStatus) {
    MessageDeliveryStatus["DELIVERED"] = "delivered";
    MessageDeliveryStatus["READ"] = "read";
})(MessageDeliveryStatus || (exports.MessageDeliveryStatus = MessageDeliveryStatus = {}));
/**
 * Lightweight shim for Stream's `useMessageDeliveryStatus` hook.
 * It mirrors the public API but only implements minimal behaviour.
 */
var useMessageDeliveryStatus = function (_a) {
    var channel = _a.channel, lastMessage = _a.lastMessage;
    var client = channel.client;
    var _b = (0, react_1.useState)(), messageDeliveryStatus = _b[0], setMessageDeliveryStatus = _b[1];
    var isOwnMessage = (0, react_1.useCallback)(function (message) { var _a; return client.user && ((_a = message === null || message === void 0 ? void 0 : message.user) === null || _a === void 0 ? void 0 : _a.id) === client.user.id; }, [client]);
    (0, react_1.useEffect)(function () {
        var lastMessageIsOwn = isOwnMessage(lastMessage);
        if (!(lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.created_at) || !lastMessageIsOwn)
            return;
        var lastMessageCreatedAtDate = typeof lastMessage.created_at === 'string'
            ? new Date(lastMessage.created_at)
            : lastMessage.created_at;
        var channelReadByOthersAfterLastMessageUpdate = Object.values(channel.state.read).some(function (_a) {
            var channelLastMarkedReadDate = _a.last_read, user = _a.user;
            var ignoreOwnReadStatus = client.user && user.id !== client.user.id;
            return ignoreOwnReadStatus && lastMessageCreatedAtDate < channelLastMarkedReadDate;
        });
        setMessageDeliveryStatus(channelReadByOthersAfterLastMessageUpdate
            ? MessageDeliveryStatus.READ
            : MessageDeliveryStatus.DELIVERED);
    }, [channel.state.read, client, isOwnMessage, lastMessage]);
    (0, react_1.useEffect)(function () {
        var handleMessageNew = function (event) {
            if (!isOwnMessage(event.message)) {
                return setMessageDeliveryStatus(undefined);
            }
            return setMessageDeliveryStatus(MessageDeliveryStatus.DELIVERED);
        };
        channel.on('message.new', handleMessageNew);
        return function () {
            channel.off('message.new', handleMessageNew);
        };
    }, [channel, client, isOwnMessage]);
    (0, react_1.useEffect)(function () {
        if (!isOwnMessage(lastMessage))
            return;
        var handleMarkRead = function (event) {
            var _a, _b;
            if (((_a = event.user) === null || _a === void 0 ? void 0 : _a.id) !== ((_b = client.user) === null || _b === void 0 ? void 0 : _b.id))
                setMessageDeliveryStatus(MessageDeliveryStatus.READ);
        };
        channel.on('message.read', handleMarkRead);
        return function () {
            channel.off('message.read', handleMarkRead);
        };
    }, [channel, client, lastMessage, isOwnMessage]);
    return {
        messageDeliveryStatus: messageDeliveryStatus,
    };
};
exports.useMessageDeliveryStatus = useMessageDeliveryStatus;
