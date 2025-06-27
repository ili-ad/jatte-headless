"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSearchQueriesInProgress = void 0;
var react_1 = require("react");
/**
 * Minimal placeholder implementation of Stream's `useSearchQueriesInProgress` hook.
 * Tracks the number of active search queries and exposes helpers to update it.
 */
var useSearchQueriesInProgress = function () {
    var _a = (0, react_1.useState)(0), queriesInProgress = _a[0], setQueriesInProgress = _a[1];
    var startQuery = (0, react_1.useCallback)(function () {
        setQueriesInProgress(function (count) { return count + 1; });
    }, []);
    var endQuery = (0, react_1.useCallback)(function () {
        setQueriesInProgress(function (count) { return Math.max(0, count - 1); });
    }, []);
    return { queriesInProgress: queriesInProgress, startQuery: startQuery, endQuery: endQuery };
};
exports.useSearchQueriesInProgress = useSearchQueriesInProgress;
exports.default = exports.useSearchQueriesInProgress;
