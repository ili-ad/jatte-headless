"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useShouldForceScrollToBottom = useShouldForceScrollToBottom;
var react_1 = require("react");
/**
 * Minimal implementation of Stream's `useShouldForceScrollToBottom` hook.
 * It inspects the provided messages and returns a callback that indicates
 * whether a new message from the current user was appended to the list.
 */
function useShouldForceScrollToBottom(messages, currentUserId) {
    var lastFocusedOwnMessage = (0, react_1.useRef)('');
    var initialFocusRegistered = (0, react_1.useRef)(false);
    function recheckForNewOwnMessage() {
        var _a;
        if (messages && messages.length > 0) {
            var lastMessage = messages[messages.length - 1];
            if (((_a = lastMessage.user) === null || _a === void 0 ? void 0 : _a.id) === currentUserId &&
                lastFocusedOwnMessage.current !== lastMessage.id) {
                lastFocusedOwnMessage.current = lastMessage.id;
                return true;
            }
        }
        return false;
    }
    (0, react_1.useEffect)(function () {
        if (messages && messages.length && !initialFocusRegistered.current) {
            initialFocusRegistered.current = true;
            recheckForNewOwnMessage();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, messages === null || messages === void 0 ? void 0 : messages.length]);
    return recheckForNewOwnMessage;
}
exports.default = useShouldForceScrollToBottom;
