"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChannelDeletedListener = void 0;
var react_1 = require("react");
var useChannelDeletedListener = function (setChannels, customHandler) {
    (0, react_1.useEffect)(function () {
        // TODO: wire up real Stream Chat client events
    }, [setChannels, customHandler]);
};
exports.useChannelDeletedListener = useChannelDeletedListener;
