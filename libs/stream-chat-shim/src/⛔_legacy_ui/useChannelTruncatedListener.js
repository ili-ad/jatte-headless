"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChannelTruncatedListener = void 0;
var react_1 = require("react");
var useChannelTruncatedListener = function (setChannels, customHandler, forceUpdate) {
    (0, react_1.useEffect)(function () {
        // TODO: wire up real Stream Chat client events
    }, [setChannels, customHandler, forceUpdate]);
};
exports.useChannelTruncatedListener = useChannelTruncatedListener;
