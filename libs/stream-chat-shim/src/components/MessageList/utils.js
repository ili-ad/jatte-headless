"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIsFirstUnreadMessage = exports.hasNotMoreMessages = exports.hasMoreMessagesProbably = exports.getGroupStyles = exports.insertIntro = exports.getReadStates = exports.getLastReceived = exports.makeDateMessageId = exports.makeIntroMessage = exports.processMessages = void 0;
exports.isIntroMessage = isIntroMessage;
exports.isDateSeparatorMessage = isDateSeparatorMessage;
exports.isLocalMessage = isLocalMessage;
var nanoid_1 = require("nanoid");
var messageTypes_1 = require("../../constants/messageTypes");
var utils_1 = require("../Message/utils");
var i18n_1 = require("../../i18n");
/**
 * processMessages - Transform the input message list according to config parameters
 *
 * Inserts date separators btw. messages created on different dates or before unread incoming messages. By default:
 * - enabled in main message list
 * - disabled in virtualized message list
 * - disabled in thread
 *
 * Allows to filter out deleted messages, contolled by hideDeletedMessages param. This is disabled by default.
 *
 * Sets Giphy preview message for VirtualizedMessageList
 *
 * The only required params are messages and userId, the rest are config params:
 *
 * @return {LocalMessage[]} Transformed list of messages
 */
var processMessages = function (params) {
    var _a;
    var messages = params.messages, reviewProcessedMessage = params.reviewProcessedMessage, setGiphyPreviewMessage = params.setGiphyPreviewMessage, context = __rest(params, ["messages", "reviewProcessedMessage", "setGiphyPreviewMessage"]);
    var enableDateSeparator = context.enableDateSeparator, hideDeletedMessages = context.hideDeletedMessages, hideNewMessageSeparator = context.hideNewMessageSeparator, lastRead = context.lastRead, userId = context.userId;
    var unread = false;
    var ephemeralMessagePresent = false;
    var lastDateSeparator;
    var newMessages = [];
    for (var i = 0; i < messages.length; i += 1) {
        var message = messages[i];
        if (hideDeletedMessages && message.type === 'deleted') {
            continue;
        }
        if (setGiphyPreviewMessage &&
            message.type === 'ephemeral' &&
            message.command === 'giphy') {
            ephemeralMessagePresent = true;
            setGiphyPreviewMessage(message);
            continue;
        }
        var changes = [];
        var messageDate = (message.created_at &&
            (0, i18n_1.isDate)(message.created_at) &&
            message.created_at.toDateString()) ||
            '';
        var previousMessage = messages[i - 1];
        var prevMessageDate = messageDate;
        if (enableDateSeparator &&
            (previousMessage === null || previousMessage === void 0 ? void 0 : previousMessage.created_at) &&
            (0, i18n_1.isDate)(previousMessage.created_at)) {
            prevMessageDate = previousMessage.created_at.toDateString();
        }
        if (!unread && !hideNewMessageSeparator) {
            unread =
                (lastRead && message.created_at && new Date(lastRead) < message.created_at) ||
                    false;
            // do not show date separator for current user's messages
            if (enableDateSeparator && unread && ((_a = message.user) === null || _a === void 0 ? void 0 : _a.id) !== userId) {
                changes.push({
                    customType: messageTypes_1.CUSTOM_MESSAGE_TYPE.date,
                    date: message.created_at,
                    id: (0, exports.makeDateMessageId)(message.created_at),
                    unread: unread,
                });
            }
        }
        if (enableDateSeparator &&
            (i === 0 || // always put date separator before the first message
                messageDate !== prevMessageDate || // add date separator btw. 2 messages created on different date
                // if hiding deleted messages replace the previous deleted message(s) with A separator if the last rendered message was created on different date
                (hideDeletedMessages &&
                    (previousMessage === null || previousMessage === void 0 ? void 0 : previousMessage.type) === 'deleted' &&
                    lastDateSeparator !== messageDate)) &&
            !isDateSeparatorMessage(changes[changes.length - 1]) // do not show two date separators in a row)
        ) {
            lastDateSeparator = messageDate;
            changes.push({
                customType: messageTypes_1.CUSTOM_MESSAGE_TYPE.date,
                date: message.created_at,
                id: (0, exports.makeDateMessageId)(message.created_at),
            }, message);
        }
        else {
            changes.push(message);
        }
        newMessages.push.apply(newMessages, ((reviewProcessedMessage === null || reviewProcessedMessage === void 0 ? void 0 : reviewProcessedMessage({
            changes: changes,
            context: context,
            index: i,
            messages: messages,
            processedMessages: newMessages,
        })) || changes));
    }
    // clean up the giphy preview component state after a Cancel action
    if (setGiphyPreviewMessage && !ephemeralMessagePresent) {
        setGiphyPreviewMessage(undefined);
    }
    return newMessages;
};
exports.processMessages = processMessages;
var makeIntroMessage = function () { return ({
    customType: messageTypes_1.CUSTOM_MESSAGE_TYPE.intro,
    id: (0, nanoid_1.nanoid)(),
}); };
exports.makeIntroMessage = makeIntroMessage;
var makeDateMessageId = function (date) {
    var idSuffix;
    try {
        idSuffix = !date ? (0, nanoid_1.nanoid)() : date instanceof Date ? date.toISOString() : date;
    }
    catch (e) {
        idSuffix = (0, nanoid_1.nanoid)();
    }
    return "".concat(messageTypes_1.CUSTOM_MESSAGE_TYPE.date, "-").concat(idSuffix);
};
exports.makeDateMessageId = makeDateMessageId;
// fast since it usually iterates just the last few messages
var getLastReceived = function (messages) {
    for (var i = messages.length - 1; i > 0; i -= 1) {
        if (messages[i].status === 'received') {
            return messages[i].id;
        }
    }
    return null;
};
exports.getLastReceived = getLastReceived;
var getReadStates = function (messages, read, returnAllReadData) {
    if (read === void 0) { read = {}; }
    // create object with empty array for each message id
    var readData = {};
    Object.values(read).forEach(function (readState) {
        if (!readState.last_read)
            return;
        var userLastReadMsgId;
        // loop messages sent by current user and add read data for other users in channel
        messages.forEach(function (msg) {
            if (msg.created_at && msg.created_at < readState.last_read) {
                userLastReadMsgId = msg.id;
                // if true, save other user's read data for all messages they've read
                if (returnAllReadData) {
                    if (!readData[userLastReadMsgId]) {
                        readData[userLastReadMsgId] = [];
                    }
                    readData[userLastReadMsgId].push(readState.user);
                }
            }
        });
        // if true, only save read data for other user's last read message
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
var insertIntro = function (messages, headerPosition) {
    var newMessages = messages;
    var intro = (0, exports.makeIntroMessage)();
    // if no headerPosition is set, HeaderComponent will go at the top
    if (!headerPosition) {
        newMessages.unshift(intro);
        return newMessages;
    }
    // if no messages, intro gets inserted
    if (!newMessages.length) {
        newMessages.unshift(intro);
        return newMessages;
    }
    // else loop over the messages
    for (var i = 0; i < messages.length; i += 1) {
        var messageTime = (0, i18n_1.isDate)(messages[i].created_at)
            ? messages[i].created_at.getTime()
            : null;
        var nextMessageTime = (0, i18n_1.isDate)(messages[i + 1].created_at)
            ? messages[i + 1].created_at.getTime()
            : null;
        // header position is smaller than message time so comes after;
        if (messageTime && messageTime < headerPosition) {
            // if header position is also smaller than message time continue;
            if (nextMessageTime && nextMessageTime < headerPosition) {
                if (messages[i + 1] && isDateSeparatorMessage(messages[i + 1]))
                    continue;
                if (!nextMessageTime) {
                    newMessages.push(intro);
                    return newMessages;
                }
            }
            else {
                newMessages.splice(i + 1, 0, intro);
                return newMessages;
            }
        }
    }
    return newMessages;
};
exports.insertIntro = insertIntro;
var getGroupStyles = function (message, previousMessage, nextMessage, noGroupByUser, maxTimeBetweenGroupedMessages) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (isDateSeparatorMessage(message) || isIntroMessage(message))
        return '';
    if (noGroupByUser || ((_a = message.attachments) === null || _a === void 0 ? void 0 : _a.length) !== 0)
        return 'single';
    var isTopMessage = !previousMessage ||
        isIntroMessage(previousMessage) ||
        isDateSeparatorMessage(previousMessage) ||
        previousMessage.type === 'system' ||
        previousMessage.type === 'error' ||
        ((_b = previousMessage.attachments) === null || _b === void 0 ? void 0 : _b.length) !== 0 ||
        ((_c = message.user) === null || _c === void 0 ? void 0 : _c.id) !== ((_d = previousMessage.user) === null || _d === void 0 ? void 0 : _d.id) ||
        previousMessage.deleted_at ||
        (message.reaction_groups && Object.keys(message.reaction_groups).length > 0) ||
        (0, utils_1.isMessageEdited)(previousMessage) ||
        (maxTimeBetweenGroupedMessages !== undefined &&
            previousMessage.created_at &&
            message.created_at &&
            new Date(message.created_at).getTime() -
                new Date(previousMessage.created_at).getTime() >
                maxTimeBetweenGroupedMessages);
    var isBottomMessage = !nextMessage ||
        isIntroMessage(nextMessage) ||
        isDateSeparatorMessage(nextMessage) ||
        nextMessage.type === 'system' ||
        nextMessage.type === 'error' ||
        ((_e = nextMessage.attachments) === null || _e === void 0 ? void 0 : _e.length) !== 0 ||
        ((_f = message.user) === null || _f === void 0 ? void 0 : _f.id) !== ((_g = nextMessage.user) === null || _g === void 0 ? void 0 : _g.id) ||
        nextMessage.deleted_at ||
        (nextMessage.reaction_groups &&
            Object.keys(nextMessage.reaction_groups).length > 0) ||
        (0, utils_1.isMessageEdited)(message) ||
        (maxTimeBetweenGroupedMessages !== undefined &&
            nextMessage.created_at &&
            message.created_at &&
            new Date(nextMessage.created_at).getTime() -
                new Date(message.created_at).getTime() >
                maxTimeBetweenGroupedMessages);
    if (!isTopMessage && !isBottomMessage) {
        if (message.deleted_at || message.type === 'error')
            return 'single';
        return 'middle';
    }
    if (isBottomMessage) {
        if (isTopMessage || message.deleted_at || message.type === 'error')
            return 'single';
        return 'bottom';
    }
    if (isTopMessage)
        return 'top';
    return '';
};
exports.getGroupStyles = getGroupStyles;
// "Probably" included, because it may happen that the last page was returned and it has exactly the size of the limit
// but the back-end cannot provide us with information on whether it has still more messages in the DB
// FIXME: once the pagination state is moved from Channel to MessageList, these should be moved as well.
//  The MessageList should have configurable the limit for performing the requests.
//  This parameter would then be used within these functions
var hasMoreMessagesProbably = function (returnedCountMessages, limit) {
    return returnedCountMessages >= limit;
};
exports.hasMoreMessagesProbably = hasMoreMessagesProbably;
// @deprecated
var hasNotMoreMessages = function (returnedCountMessages, limit) {
    return returnedCountMessages < limit;
};
exports.hasNotMoreMessages = hasNotMoreMessages;
function isIntroMessage(message) {
    return message.customType === messageTypes_1.CUSTOM_MESSAGE_TYPE.intro;
}
function isDateSeparatorMessage(message) {
    return (message !== null &&
        typeof message === 'object' &&
        message.customType === messageTypes_1.CUSTOM_MESSAGE_TYPE.date &&
        (0, i18n_1.isDate)(message.date));
}
function isLocalMessage(message) {
    return !isDateSeparatorMessage(message) && !isIntroMessage(message);
}
var getIsFirstUnreadMessage = function (_a) {
    var firstUnreadMessageId = _a.firstUnreadMessageId, isFirstMessage = _a.isFirstMessage, lastReadDate = _a.lastReadDate, lastReadMessageId = _a.lastReadMessageId, message = _a.message, previousMessage = _a.previousMessage, _b = _a.unreadMessageCount, unreadMessageCount = _b === void 0 ? 0 : _b;
    // prevent showing unread indicator in threads
    if (message.parent_id)
        return false;
    var createdAtTimestamp = message.created_at && new Date(message.created_at).getTime();
    var lastReadTimestamp = lastReadDate === null || lastReadDate === void 0 ? void 0 : lastReadDate.getTime();
    var messageIsUnread = !!createdAtTimestamp && !!lastReadTimestamp && createdAtTimestamp > lastReadTimestamp;
    var previousMessageIsLastRead = !!lastReadMessageId && lastReadMessageId === (previousMessage === null || previousMessage === void 0 ? void 0 : previousMessage.id);
    return (firstUnreadMessageId === message.id ||
        (!!unreadMessageCount &&
            messageIsUnread &&
            (isFirstMessage || previousMessageIsLastRead)));
};
exports.getIsFirstUnreadMessage = getIsFirstUnreadMessage;
