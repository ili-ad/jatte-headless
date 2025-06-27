"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNotificationMessageNewListener = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation of Stream's `useNotificationMessageNewListener` hook.
 * It currently does not subscribe to any events.
 */
var useNotificationMessageNewListener = function (setChannels, customHandler, allowNewMessagesFromUnfilteredChannels) {
    if (allowNewMessagesFromUnfilteredChannels === void 0) { allowNewMessagesFromUnfilteredChannels = true; }
    (0, react_1.useEffect)(function () {
        // TODO: wire up real Stream Chat client events
    }, [setChannels, customHandler, allowNewMessagesFromUnfilteredChannels]);
};
exports.useNotificationMessageNewListener = useNotificationMessageNewListener;
