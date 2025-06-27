"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChannelHiddenListener = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation of Stream's `useChannelHiddenListener` hook.
 */
var useChannelHiddenListener = function (setChannels, customHandler) {
    (0, react_1.useEffect)(function () {
        // TODO: wire up real Stream Chat client events
    }, [setChannels, customHandler]);
};
exports.useChannelHiddenListener = useChannelHiddenListener;
