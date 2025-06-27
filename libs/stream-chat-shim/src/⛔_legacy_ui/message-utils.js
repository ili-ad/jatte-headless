"use strict";
// libs/stream-chat-shim/src/message-utils.tsx
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
var validateAndGetMessage = function (func, args) {
    if (typeof func !== 'function')
        return null;
    if (!Array.isArray(args))
        args = [args];
    var out = func.apply(void 0, args);
    return typeof out === 'string' ? out : null;
};
exports.validateAndGetMessage = validateAndGetMessage;
var isUserMuted = function (message, mutes) {
    if (!mutes || !message)
        return false;
    return mutes.some(function (m) { var _a; return m.target.id === ((_a = message.user) === null || _a === void 0 ? void 0 : _a.id); });
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
    var out = [];
    var list = [];
    if (actions && typeof actions === 'boolean') {
        list = Object.keys(exports.MESSAGE_ACTIONS);
    }
    else if (actions && actions.length > 0) {
        list = __spreadArray([], actions, true);
    }
    else {
        return [];
    }
    if (canDelete && list.includes(exports.MESSAGE_ACTIONS.delete))
        out.push(exports.MESSAGE_ACTIONS.delete);
    if (canEdit && list.includes(exports.MESSAGE_ACTIONS.edit))
        out.push(exports.MESSAGE_ACTIONS.edit);
    if (canFlag && list.includes(exports.MESSAGE_ACTIONS.flag))
        out.push(exports.MESSAGE_ACTIONS.flag);
    if (canMarkUnread && list.includes(exports.MESSAGE_ACTIONS.markUnread))
        out.push(exports.MESSAGE_ACTIONS.markUnread);
    if (canMute && list.includes(exports.MESSAGE_ACTIONS.mute))
        out.push(exports.MESSAGE_ACTIONS.mute);
    if (canPin && list.includes(exports.MESSAGE_ACTIONS.pin))
        out.push(exports.MESSAGE_ACTIONS.pin);
    if (canQuote && list.includes(exports.MESSAGE_ACTIONS.quote))
        out.push(exports.MESSAGE_ACTIONS.quote);
    if (canReact && list.includes(exports.MESSAGE_ACTIONS.react))
        out.push(exports.MESSAGE_ACTIONS.react);
    if ((channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig['user_message_reminders']) && list.includes(exports.MESSAGE_ACTIONS.remindMe))
        out.push(exports.MESSAGE_ACTIONS.remindMe);
    if (canReply && list.includes(exports.MESSAGE_ACTIONS.reply))
        out.push(exports.MESSAGE_ACTIONS.reply);
    if ((channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig['user_message_reminders']) && list.includes(exports.MESSAGE_ACTIONS.saveForLater))
        out.push(exports.MESSAGE_ACTIONS.saveForLater);
    return out;
};
exports.getMessageActions = getMessageActions;
exports.ACTIONS_NOT_WORKING_IN_THREAD = [
    exports.MESSAGE_ACTIONS.pin,
    exports.MESSAGE_ACTIONS.reply,
    exports.MESSAGE_ACTIONS.markUnread,
];
var showMessageActionsBox = function (actions, inThread) { return (0, exports.shouldRenderMessageActions)({ inThread: inThread, messageActions: actions }); };
exports.showMessageActionsBox = showMessageActionsBox;
var shouldRenderMessageActions = function (_a) {
    var customMessageActions = _a.customMessageActions, CustomMessageActionsList = _a.CustomMessageActionsList, inThread = _a.inThread, messageActions = _a.messageActions;
    if (typeof CustomMessageActionsList !== 'undefined' || typeof customMessageActions !== 'undefined') {
        return true;
    }
    if (!messageActions.length)
        return false;
    if (inThread &&
        messageActions.filter(function (a) { return !exports.ACTIONS_NOT_WORKING_IN_THREAD.includes(a); }).length === 0) {
        return false;
    }
    if (messageActions.length === 1 &&
        (messageActions.includes(exports.MESSAGE_ACTIONS.react) || messageActions.includes(exports.MESSAGE_ACTIONS.reply))) {
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
var areMessagePropsEqual = function (_prevProps, _nextProps) { return false; };
exports.areMessagePropsEqual = areMessagePropsEqual;
var areMessageUIPropsEqual = function (_prevProps, _nextProps) { return false; };
exports.areMessageUIPropsEqual = areMessageUIPropsEqual;
var messageHasReactions = function (message) { var _a; return Object.values((_a = message === null || message === void 0 ? void 0 : message.reaction_groups) !== null && _a !== void 0 ? _a : {}).some(function (_a) {
    var count = _a.count;
    return count > 0;
}); };
exports.messageHasReactions = messageHasReactions;
var messageHasAttachments = function (message) {
    return !!(message === null || message === void 0 ? void 0 : message.attachments) && message.attachments.length > 0;
};
exports.messageHasAttachments = messageHasAttachments;
var getImages = function (message) {
    if (!(message === null || message === void 0 ? void 0 : message.attachments))
        return [];
    return message.attachments.filter(function (item) { return item.type === 'image'; });
};
exports.getImages = getImages;
var getNonImageAttachments = function (message) {
    if (!(message === null || message === void 0 ? void 0 : message.attachments))
        return [];
    return message.attachments.filter(function (item) { return item.type !== 'image'; });
};
exports.getNonImageAttachments = getNonImageAttachments;
var mapToUserNameOrId = function (user) { return user.name || user.id; };
exports.mapToUserNameOrId = mapToUserNameOrId;
var getReadByTooltipText = function (users, t, client, tooltipUserNameMapper) {
    var others = users
        .filter(function (u) { return u && (client === null || client === void 0 ? void 0 : client.user) && u.id !== client.user.id; })
        .map(tooltipUserNameMapper);
    return others.join(', ');
};
exports.getReadByTooltipText = getReadByTooltipText;
var emojiPattern = /[\p{Emoji_Presentation}\uFE0F]/u;
var isOnlyEmojis = function (text) {
    if (!text)
        return false;
    var noEmojis = text.replace(emojiPattern, '');
    var noSpace = noEmojis.replace(/[\s\n]/gm, '');
    return noSpace.length === 0;
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
