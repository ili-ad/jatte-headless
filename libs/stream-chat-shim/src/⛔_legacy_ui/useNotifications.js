"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNotifications = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation of Stream's `useNotifications` hook.
 * Currently returns an empty list and performs no real subscriptions.
 */
var useNotifications = function () {
    var notifications = (0, react_1.useState)([])[0];
    (0, react_1.useEffect)(function () {
        // TODO: integrate with Stream Chat client's notifications store
    }, []);
    return notifications;
};
exports.useNotifications = useNotifications;
exports.default = exports.useNotifications;
