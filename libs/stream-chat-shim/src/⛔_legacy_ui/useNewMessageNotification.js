"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNewMessageNotification = useNewMessageNotification;
// libs/stream-chat-shim/src/useNewMessageNotification.ts
var react_1 = require("react");
/**
 * Placeholder implementation of Stream's `useNewMessageNotification` hook.
 *
 * It exposes the same API shape but performs no real notification logic.
 */
function useNewMessageNotification(_messages, _currentUserId, _hasMoreNewer) {
    var _a = (0, react_1.useState)(false), newMessagesNotification = _a[0], setNewMessagesNotification = _a[1];
    var _b = (0, react_1.useState)(true), isMessageListScrolledToBottom = _b[0], setIsMessageListScrolledToBottom = _b[1];
    var atBottom = (0, react_1.useRef)(false);
    // TODO: connect to Stream Chat events
    return {
        atBottom: atBottom,
        isMessageListScrolledToBottom: isMessageListScrolledToBottom,
        newMessagesNotification: newMessagesNotification,
        setIsMessageListScrolledToBottom: setIsMessageListScrolledToBottom,
        setNewMessagesNotification: setNewMessagesNotification,
    };
}
exports.default = useNewMessageNotification;
