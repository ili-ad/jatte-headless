"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChannelsQueryState = void 0;
var react_1 = require("react");
/**
 * Lightweight shim for Stream's `useChannelsQueryState` hook.
 * It only exposes state setters and does not perform any query logic.
 */
var useChannelsQueryState = function () {
    var _a = (0, react_1.useState)(null), error = _a[0], setError = _a[1];
    var _b = (0, react_1.useState)(null), queryInProgress = _b[0], setQueryInProgress = _b[1];
    return {
        error: error,
        queryInProgress: queryInProgress,
        setError: setError,
        setQueryInProgress: setQueryInProgress,
    };
};
exports.useChannelsQueryState = useChannelsQueryState;
exports.default = exports.useChannelsQueryState;
