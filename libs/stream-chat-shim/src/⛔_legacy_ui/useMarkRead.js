"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMarkRead = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation of Stream's `useMarkRead` hook.
 * Logs a warning whenever the provided parameters change.
 */
var useMarkRead = function (_params) {
    (0, react_1.useEffect)(function () {
        console.warn('useMarkRead not implemented');
    }, [
        _params.isMessageListScrolledToBottom,
        _params.messageListIsThread,
        _params.wasMarkedUnread,
    ]);
};
exports.useMarkRead = useMarkRead;
exports.default = exports.useMarkRead;
