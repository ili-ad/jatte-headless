"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUserRole = void 0;
/**
 * Placeholder implementation of Stream's `useUserRole` hook.
 *
 * Returns a structure describing what actions the current user is
 * allowed to perform on the given message. This shim does not yet
 * integrate with the Stream Chat context or channel capabilities and
 * therefore defaults most permissions to `false`.
 *
 * @param message - The message to evaluate permissions for.
 * @param onlySenderCanEdit - Whether only the sender can edit their message.
 * @param disableQuotedMessages - If quoting messages is disabled.
 */
var useUserRole = function (message, _onlySenderCanEdit, _disableQuotedMessages) {
    var _a;
    var client = message.client;
    var isMyMessage = (client === null || client === void 0 ? void 0 : client.userID) === ((_a = message.user) === null || _a === void 0 ? void 0 : _a.id);
    return {
        canDelete: false,
        canEdit: false,
        canFlag: false,
        canMarkUnread: false,
        canMute: false,
        canQuote: false,
        canReact: false,
        canReply: false,
        isAdmin: false,
        isModerator: false,
        isMyMessage: isMyMessage,
        isOwner: false,
    };
};
exports.useUserRole = useUserRole;
