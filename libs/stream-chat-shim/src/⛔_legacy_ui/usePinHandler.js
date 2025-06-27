"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePinHandler = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation of Stream's `usePinHandler` hook.
 * Returns a handler that throws to indicate unimplemented behaviour.
 */
var usePinHandler = function (_message, _permissions, _notifications) {
    if (_permissions === void 0) { _permissions = {}; }
    if (_notifications === void 0) { _notifications = {}; }
    var handlePin = (0, react_1.useCallback)(function () {
        throw new Error('usePinHandler not implemented');
    }, []);
    var canPin = false;
    return { canPin: canPin, handlePin: handlePin };
};
exports.usePinHandler = usePinHandler;
