"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSearchFocusedMessage = void 0;
/**
 * Placeholder implementation of Stream's `useSearchFocusedMessage` hook.
 *
 * Returns the message currently focused in search results.
 * This shim does not connect to Stream Chat state and always returns `null`.
 */
var useSearchFocusedMessage = function () {
    // TODO: integrate with real search controller state
    return null;
};
exports.useSearchFocusedMessage = useSearchFocusedMessage;
exports.default = exports.useSearchFocusedMessage;
