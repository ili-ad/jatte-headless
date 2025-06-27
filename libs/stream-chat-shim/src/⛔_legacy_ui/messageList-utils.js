"use strict";
// libs/stream-chat-shim/src/messageList-utils.ts
// Minimal placeholder implementations for Stream's MessageList utilities.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIsFirstUnreadMessage = exports.hasNotMoreMessages = exports.hasMoreMessagesProbably = exports.getGroupStyles = exports.insertIntro = exports.getReadStates = exports.getLastReceived = exports.makeDateMessageId = exports.makeIntroMessage = exports.processMessages = void 0;
exports.isIntroMessage = isIntroMessage;
exports.isDateSeparatorMessage = isDateSeparatorMessage;
exports.isLocalMessage = isLocalMessage;
var CUSTOM_MESSAGE_TYPE = {
    intro: 'intro',
    date: 'date',
};
var processMessages = function (params) {
    // TODO: implement real message processing logic
    return params.messages;
};
exports.processMessages = processMessages;
// simple nanoid substitute – avoids extra deps
var nanoid = function () { return Math.random().toString(36).slice(2); };
var makeIntroMessage = function () { return ({
    customType: CUSTOM_MESSAGE_TYPE.intro,
    id: nanoid(),
}); };
exports.makeIntroMessage = makeIntroMessage;
var makeDateMessageId = function (date) {
    var suffix = date instanceof Date ? date.toISOString() : date !== null && date !== void 0 ? date : nanoid();
    return "".concat(CUSTOM_MESSAGE_TYPE.date, "-").concat(suffix);
};
exports.makeDateMessageId = makeDateMessageId;
var getLastReceived = function (messages) {
    for (var i = messages.length - 1; i >= 0; i--) {
        var msg = messages[i];
        if (msg.status === 'received')
            return msg.id;
    }
    return null;
};
exports.getLastReceived = getLastReceived;
var getReadStates = function (_messages, _read, _returnAllReadData) {
    if (_read === void 0) { _read = {}; }
    // Placeholder: return empty read data
    return {};
};
exports.getReadStates = getReadStates;
var insertIntro = function (messages, _headerPosition) {
    // Simply return messages with intro prepended if empty
    if (messages.length === 0)
        return [(0, exports.makeIntroMessage)()];
    return messages;
};
exports.insertIntro = insertIntro;
var getGroupStyles = function (_message, _previousMessage, _nextMessage, _noGroupByUser, _maxTimeBetweenGroupedMessages) { return ''; };
exports.getGroupStyles = getGroupStyles;
var hasMoreMessagesProbably = function (returnedCountMessages, limit) { return returnedCountMessages >= limit; };
exports.hasMoreMessagesProbably = hasMoreMessagesProbably;
var hasNotMoreMessages = function (returnedCountMessages, limit) { return returnedCountMessages < limit; };
exports.hasNotMoreMessages = hasNotMoreMessages;
function isIntroMessage(message) {
    return (!!message &&
        typeof message === 'object' &&
        message.customType === CUSTOM_MESSAGE_TYPE.intro);
}
function isDateSeparatorMessage(message) {
    return (!!message &&
        typeof message === 'object' &&
        message.customType === CUSTOM_MESSAGE_TYPE.date);
}
function isLocalMessage(message) {
    return !isDateSeparatorMessage(message) && !isIntroMessage(message);
}
var getIsFirstUnreadMessage = function (_params) { return false; };
exports.getIsFirstUnreadMessage = getIsFirstUnreadMessage;
exports.default = {};
