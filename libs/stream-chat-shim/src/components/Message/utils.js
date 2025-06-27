"use strict";
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
exports.isMessageEdited = exports.isMessageBlocked = exports.isMessageBounced = exports.isOnlyEmojis = exports.getReadByTooltipText = exports.mapToUserNameOrId = exports.getNonImageAttachments = exports.getImages = exports.messageHasAttachments = exports.messageHasReactions = exports.areMessageUIPropsEqual = exports.areMessagePropsEqual = exports.shouldRenderMessageActions = exports.showMessageActionsBox = exports.ACTIONS_NOT_WORKING_IN_THREAD = exports.getMessageActions = exports.defaultPinPermissions = exports.MESSAGE_ACTIONS = exports.isUserMuted = exports.validateAndGetMessage = void 0;
var react_fast_compare_1 = require("react-fast-compare");
var emoji_regex_1 = require("emoji-regex");
/**
 * Following function validates a function which returns notification message.
 * It validates if the first parameter is function and also if return value of function is string or no.
 */
var validateAndGetMessage = function (func, args) {
    if (!func || typeof func !== 'function')
        return null;
    // below is due to tests passing a single argument
    // rather than an array.
    if (!Array.isArray(args)) {
        args = [args];
    }
    var returnValue = func.apply(void 0, args);
    if (typeof returnValue !== 'string')
        return null;
    return returnValue;
};
exports.validateAndGetMessage = validateAndGetMessage;
/**
 * Tell if the owner of the current message is muted
 */
var isUserMuted = function (message, mutes) {
    if (!mutes || !message)
        return false;
    var userMuted = mutes.filter(function (el) { var _a; return el.target.id === ((_a = message.user) === null || _a === void 0 ? void 0 : _a.id); });
    return !!userMuted.length;
};
exports.isUserMuted = isUserMuted;
exports.MESSAGE_ACTIONS = {
    delete: 'delete',
    edit: 'edit',
    flag: 'flag',
    markUnread: 'markUnread',
    mute: 'mute',
    pin: 'pin',
    quote: 'quote',
    react: 'react',
    remindMe: 'remindMe',
    reply: 'reply',
    saveForLater: 'saveForLater',
};
// @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
exports.defaultPinPermissions = {
    commerce: {
        admin: true,
        anonymous: false,
        channel_member: false,
        channel_moderator: true,
        guest: false,
        member: false,
        moderator: true,
        owner: true,
        user: false,
    },
    gaming: {
        admin: true,
        anonymous: false,
        channel_member: false,
        channel_moderator: true,
        guest: false,
        member: false,
        moderator: true,
        owner: false,
        user: false,
    },
    livestream: {
        admin: true,
        anonymous: false,
        channel_member: false,
        channel_moderator: true,
        guest: false,
        member: false,
        moderator: true,
        owner: true,
        user: false,
    },
    messaging: {
        admin: true,
        anonymous: false,
        channel_member: true,
        channel_moderator: true,
        guest: false,
        member: true,
        moderator: true,
        owner: true,
        user: false,
    },
    team: {
        admin: true,
        anonymous: false,
        channel_member: true,
        channel_moderator: true,
        guest: false,
        member: true,
        moderator: true,
        owner: true,
        user: false,
    },
};
var getMessageActions = function (actions, _a, channelConfig) {
    var canDelete = _a.canDelete, canEdit = _a.canEdit, canFlag = _a.canFlag, canMarkUnread = _a.canMarkUnread, canMute = _a.canMute, canPin = _a.canPin, canQuote = _a.canQuote, canReact = _a.canReact, canReply = _a.canReply;
    var messageActionsAfterPermission = [];
    var messageActions = [];
    if (actions && typeof actions === 'boolean') {
        // If value of actions is true, then populate all the possible values
        messageActions = Object.keys(exports.MESSAGE_ACTIONS);
    }
    else if (actions && actions.length > 0) {
        messageActions = __spreadArray([], actions, true);
    }
    else {
        return [];
    }
    if (canDelete && messageActions.indexOf(exports.MESSAGE_ACTIONS.delete) > -1) {
        messageActionsAfterPermission.push(exports.MESSAGE_ACTIONS.delete);
    }
    if (canEdit && messageActions.indexOf(exports.MESSAGE_ACTIONS.edit) > -1) {
        messageActionsAfterPermission.push(exports.MESSAGE_ACTIONS.edit);
    }
    if (canFlag && messageActions.indexOf(exports.MESSAGE_ACTIONS.flag) > -1) {
        messageActionsAfterPermission.push(exports.MESSAGE_ACTIONS.flag);
    }
    if (canMarkUnread && messageActions.indexOf(exports.MESSAGE_ACTIONS.markUnread) > -1) {
        messageActionsAfterPermission.push(exports.MESSAGE_ACTIONS.markUnread);
    }
    if (canMute && messageActions.indexOf(exports.MESSAGE_ACTIONS.mute) > -1) {
        messageActionsAfterPermission.push(exports.MESSAGE_ACTIONS.mute);
    }
    if (canPin && messageActions.indexOf(exports.MESSAGE_ACTIONS.pin) > -1) {
        messageActionsAfterPermission.push(exports.MESSAGE_ACTIONS.pin);
    }
    if (canQuote && messageActions.indexOf(exports.MESSAGE_ACTIONS.quote) > -1) {
        messageActionsAfterPermission.push(exports.MESSAGE_ACTIONS.quote);
    }
    if (canReact && messageActions.indexOf(exports.MESSAGE_ACTIONS.react) > -1) {
        messageActionsAfterPermission.push(exports.MESSAGE_ACTIONS.react);
    }
    if ((channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig['user_message_reminders']) &&
        messageActions.indexOf(exports.MESSAGE_ACTIONS.remindMe)) {
        messageActionsAfterPermission.push(exports.MESSAGE_ACTIONS.remindMe);
    }
    if (canReply && messageActions.indexOf(exports.MESSAGE_ACTIONS.reply) > -1) {
        messageActionsAfterPermission.push(exports.MESSAGE_ACTIONS.reply);
    }
    if ((channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig['user_message_reminders']) &&
        messageActions.indexOf(exports.MESSAGE_ACTIONS.saveForLater)) {
        messageActionsAfterPermission.push(exports.MESSAGE_ACTIONS.saveForLater);
    }
    return messageActionsAfterPermission;
};
exports.getMessageActions = getMessageActions;
exports.ACTIONS_NOT_WORKING_IN_THREAD = [
    exports.MESSAGE_ACTIONS.pin,
    exports.MESSAGE_ACTIONS.reply,
    exports.MESSAGE_ACTIONS.markUnread,
];
/**
 * @deprecated use `shouldRenderMessageActions` instead
 */
var showMessageActionsBox = function (actions, inThread) { return (0, exports.shouldRenderMessageActions)({ inThread: inThread, messageActions: actions }); };
exports.showMessageActionsBox = showMessageActionsBox;
var shouldRenderMessageActions = function (_a) {
    var customMessageActions = _a.customMessageActions, CustomMessageActionsList = _a.CustomMessageActionsList, inThread = _a.inThread, messageActions = _a.messageActions;
    if (typeof CustomMessageActionsList !== 'undefined' ||
        typeof customMessageActions !== 'undefined')
        return true;
    if (!messageActions.length)
        return false;
    if (inThread &&
        messageActions.filter(function (action) { return !exports.ACTIONS_NOT_WORKING_IN_THREAD.includes(action); })
            .length === 0) {
        return false;
    }
    if (messageActions.length === 1 &&
        (messageActions.includes(exports.MESSAGE_ACTIONS.react) ||
            messageActions.includes(exports.MESSAGE_ACTIONS.reply))) {
        return false;
    }
    if (messageActions.length === 2 &&
        messageActions.includes(exports.MESSAGE_ACTIONS.react) &&
        messageActions.includes(exports.MESSAGE_ACTIONS.reply)) {
        return false;
    }
    return true;
};
exports.shouldRenderMessageActions = shouldRenderMessageActions;
function areMessagesEqual(prevMessage, nextMessage) {
    var areBaseMessagesEqual = function (prevMessage, nextMessage) {
        var _a, _b, _c, _d, _e, _f;
        return prevMessage.deleted_at === nextMessage.deleted_at &&
            ((_a = prevMessage.latest_reactions) === null || _a === void 0 ? void 0 : _a.length) === ((_b = nextMessage.latest_reactions) === null || _b === void 0 ? void 0 : _b.length) &&
            ((_c = prevMessage.own_reactions) === null || _c === void 0 ? void 0 : _c.length) === ((_d = nextMessage.own_reactions) === null || _d === void 0 ? void 0 : _d.length) &&
            prevMessage.pinned === nextMessage.pinned &&
            prevMessage.reply_count === nextMessage.reply_count &&
            prevMessage.status === nextMessage.status &&
            prevMessage.text === nextMessage.text &&
            prevMessage.type === nextMessage.type &&
            prevMessage.updated_at === nextMessage.updated_at &&
            ((_e = prevMessage.user) === null || _e === void 0 ? void 0 : _e.updated_at) === ((_f = nextMessage.user) === null || _f === void 0 ? void 0 : _f.updated_at);
    };
    return (areBaseMessagesEqual(prevMessage, nextMessage) &&
        Boolean(prevMessage.quoted_message) === Boolean(nextMessage.quoted_message) &&
        ((!prevMessage.quoted_message && !nextMessage.quoted_message) ||
            areBaseMessagesEqual(prevMessage.quoted_message, nextMessage.quoted_message)));
}
var areMessagePropsEqual = function (prevProps, nextProps) {
    var prevMessage = prevProps.message, prevMessageUI = prevProps.Message;
    var nextMessage = nextProps.message, nextMessageUI = nextProps.Message;
    if (prevMessageUI !== nextMessageUI)
        return false;
    if (prevProps.endOfGroup !== nextProps.endOfGroup)
        return false;
    if (nextProps.showDetailedReactions !== prevProps.showDetailedReactions) {
        return false;
    }
    if (nextProps.closeReactionSelectorOnClick !== prevProps.closeReactionSelectorOnClick) {
        return false;
    }
    var messagesAreEqual = areMessagesEqual(prevMessage, nextMessage);
    if (!messagesAreEqual)
        return false;
    var deepEqualProps = (0, react_fast_compare_1.default)(nextProps.messageActions, prevProps.messageActions) &&
        (0, react_fast_compare_1.default)(nextProps.readBy, prevProps.readBy) &&
        (0, react_fast_compare_1.default)(nextProps.highlighted, prevProps.highlighted) &&
        (0, react_fast_compare_1.default)(nextProps.groupStyles, prevProps.groupStyles) && // last 3 messages can have different group styles
        (0, react_fast_compare_1.default)(nextProps.mutes, prevProps.mutes) &&
        (0, react_fast_compare_1.default)(nextProps.lastReceivedId, prevProps.lastReceivedId);
    if (!deepEqualProps)
        return false;
    return (prevProps.messageListRect === nextProps.messageListRect // MessageList wrapper layout changes
    );
};
exports.areMessagePropsEqual = areMessagePropsEqual;
var areMessageUIPropsEqual = function (prevProps, nextProps) {
    var _a, _b, _c, _d;
    var prevLastReceivedId = prevProps.lastReceivedId, prevMessage = prevProps.message;
    var nextLastReceivedId = nextProps.lastReceivedId, nextMessage = nextProps.message;
    if (prevProps.editing !== nextProps.editing)
        return false;
    if (prevProps.highlighted !== nextProps.highlighted)
        return false;
    if (prevProps.endOfGroup !== nextProps.endOfGroup)
        return false;
    if (((_a = prevProps.mutes) === null || _a === void 0 ? void 0 : _a.length) !== ((_b = nextProps.mutes) === null || _b === void 0 ? void 0 : _b.length))
        return false;
    if (((_c = prevProps.readBy) === null || _c === void 0 ? void 0 : _c.length) !== ((_d = nextProps.readBy) === null || _d === void 0 ? void 0 : _d.length))
        return false;
    if (prevProps.groupStyles !== nextProps.groupStyles)
        return false;
    if (prevProps.showDetailedReactions !== nextProps.showDetailedReactions) {
        return false;
    }
    if ((prevMessage.id === prevLastReceivedId || prevMessage.id === nextLastReceivedId) &&
        prevLastReceivedId !== nextLastReceivedId) {
        return false;
    }
    return areMessagesEqual(prevMessage, nextMessage);
};
exports.areMessageUIPropsEqual = areMessageUIPropsEqual;
var messageHasReactions = function (message) { var _a; return Object.values((_a = message === null || message === void 0 ? void 0 : message.reaction_groups) !== null && _a !== void 0 ? _a : {}).some(function (_a) {
    var count = _a.count;
    return count > 0;
}); };
exports.messageHasReactions = messageHasReactions;
var messageHasAttachments = function (message) {
    return !!(message === null || message === void 0 ? void 0 : message.attachments) && !!message.attachments.length;
};
exports.messageHasAttachments = messageHasAttachments;
var getImages = function (message) {
    if (!(message === null || message === void 0 ? void 0 : message.attachments)) {
        return [];
    }
    return message.attachments.filter(function (item) { return item.type === 'image'; });
};
exports.getImages = getImages;
var getNonImageAttachments = function (message) {
    if (!(message === null || message === void 0 ? void 0 : message.attachments)) {
        return [];
    }
    return message.attachments.filter(function (item) { return item.type !== 'image'; });
};
exports.getNonImageAttachments = getNonImageAttachments;
/**
 * Default Tooltip Username mapper implementation.
 *
 * @param user the user.
 */
var mapToUserNameOrId = function (user) { return user.name || user.id; };
exports.mapToUserNameOrId = mapToUserNameOrId;
var getReadByTooltipText = function (users, t, client, tooltipUserNameMapper) {
    var outStr = '';
    if (!t) {
        throw new Error('getReadByTooltipText was called, but translation function is not available');
    }
    if (!tooltipUserNameMapper) {
        throw new Error('getReadByTooltipText was called, but tooltipUserNameMapper function is not available');
    }
    // first filter out client user, so restLength won't count it
    var otherUsers = users
        .filter(function (item) { return item && (client === null || client === void 0 ? void 0 : client.user) && item.id !== client.user.id; })
        .map(tooltipUserNameMapper);
    var slicedArr = otherUsers.slice(0, 5);
    var restLength = otherUsers.length - slicedArr.length;
    if (slicedArr.length === 1) {
        outStr = "".concat(slicedArr[0], " ");
    }
    else if (slicedArr.length === 2) {
        // joins all with "and" but =no commas
        // example: "bob and sam"
        outStr = t('{{ firstUser }} and {{ secondUser }}', {
            firstUser: slicedArr[0],
            secondUser: slicedArr[1],
        });
    }
    else if (slicedArr.length > 2) {
        // joins all with commas, but last one gets ", and" (oxford comma!)
        // example: "bob, joe, sam and 4 more"
        if (restLength === 0) {
            // mutate slicedArr to remove last user to display it separately
            var lastUser = slicedArr.splice(slicedArr.length - 1, 1);
            outStr = t('{{ commaSeparatedUsers }}, and {{ lastUser }}', {
                commaSeparatedUsers: slicedArr.join(', '),
                lastUser: lastUser,
            });
        }
        else {
            outStr = t('{{ commaSeparatedUsers }} and {{ moreCount }} more', {
                commaSeparatedUsers: slicedArr.join(', '),
                moreCount: restLength,
            });
        }
    }
    return outStr;
};
exports.getReadByTooltipText = getReadByTooltipText;
var isOnlyEmojis = function (text) {
    if (!text)
        return false;
    var noEmojis = text.replace((0, emoji_regex_1.default)(), '');
    var noSpace = noEmojis.replace(/[\s\n]/gm, '');
    return !noSpace;
};
exports.isOnlyEmojis = isOnlyEmojis;
var isMessageBounced = function (message) {
    var _a, _b;
    return message.type === 'error' &&
        (((_a = message.moderation_details) === null || _a === void 0 ? void 0 : _a.action) === 'MESSAGE_RESPONSE_ACTION_BOUNCE' ||
            ((_b = message.moderation) === null || _b === void 0 ? void 0 : _b.action) === 'bounce');
};
exports.isMessageBounced = isMessageBounced;
var isMessageBlocked = function (message) {
    var _a, _b;
    return message.type === 'error' &&
        (((_a = message.moderation_details) === null || _a === void 0 ? void 0 : _a.action) === 'MESSAGE_RESPONSE_ACTION_REMOVE' ||
            ((_b = message.moderation) === null || _b === void 0 ? void 0 : _b.action) === 'remove');
};
exports.isMessageBlocked = isMessageBlocked;
var isMessageEdited = function (message) {
    return !!message.message_text_updated_at;
};
exports.isMessageEdited = isMessageEdited;
