"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNotificationAddedToChannelListener = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation of the `useNotificationAddedToChannelListener` hook.
 *
 * @param setChannels - State setter for the list of channels.
 * @param customHandler - Optional custom event handler.
 * @param allowNewMessagesFromUnfilteredChannels - Whether new messages from unfiltered channels should add the channel.
 */
var useNotificationAddedToChannelListener = function (setChannels, customHandler, allowNewMessagesFromUnfilteredChannels) {
    if (allowNewMessagesFromUnfilteredChannels === void 0) { allowNewMessagesFromUnfilteredChannels = true; }
    (0, react_1.useEffect)(function () {
        // TODO: integrate with Stream Chat client events
    }, [setChannels, customHandler, allowNewMessagesFromUnfilteredChannels]);
};
exports.useNotificationAddedToChannelListener = useNotificationAddedToChannelListener;
exports.default = exports.useNotificationAddedToChannelListener;
