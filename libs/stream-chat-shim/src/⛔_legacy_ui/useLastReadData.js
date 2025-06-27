"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLastReadData = exports.getReadStates = void 0;
exports.isIntroMessage = isIntroMessage;
exports.isDateSeparatorMessage = isDateSeparatorMessage;
exports.isLocalMessage = isLocalMessage;
var react_1 = require("react");
var CUSTOM_MESSAGE_TYPE = {
    date: 'message.date',
    intro: 'channel.intro',
};
function isDate(value) {
    return value instanceof Date;
}
function isIntroMessage(message) {
    return (message === null || message === void 0 ? void 0 : message.customType) === CUSTOM_MESSAGE_TYPE.intro;
}
function isDateSeparatorMessage(message) {
    return (message !== null &&
        typeof message === 'object' &&
        message.customType === CUSTOM_MESSAGE_TYPE.date &&
        isDate(message.date));
}
function isLocalMessage(message) {
    return !isDateSeparatorMessage(message) && !isIntroMessage(message);
}
var getReadStates = function (messages, read, returnAllReadData) {
    if (read === void 0) { read = {}; }
    var readData = {};
    Object.values(read).forEach(function (readState) {
        if (!readState.last_read)
            return;
        var userLastReadMsgId;
        messages.forEach(function (msg) {
            if (msg.created_at && msg.created_at < readState.last_read) {
                userLastReadMsgId = msg.id;
                if (returnAllReadData) {
                    if (!readData[userLastReadMsgId]) {
                        readData[userLastReadMsgId] = [];
                    }
                    readData[userLastReadMsgId].push(readState.user);
                }
            }
        });
        if (userLastReadMsgId && !returnAllReadData) {
            if (!readData[userLastReadMsgId]) {
                readData[userLastReadMsgId] = [];
            }
            readData[userLastReadMsgId].push(readState.user);
        }
    });
    return readData;
};
exports.getReadStates = getReadStates;
var useLastReadData = function (props) {
    var messages = props.messages, read = props.read, returnAllReadData = props.returnAllReadData, userID = props.userID;
    return (0, react_1.useMemo)(function () {
        var ownLocalMessages = messages.filter(function (msg) { var _a; return isLocalMessage(msg) && ((_a = msg.user) === null || _a === void 0 ? void 0 : _a.id) === userID; });
        return (0, exports.getReadStates)(ownLocalMessages, read, returnAllReadData);
    }, [messages, read, returnAllReadData, userID]);
};
exports.useLastReadData = useLastReadData;
