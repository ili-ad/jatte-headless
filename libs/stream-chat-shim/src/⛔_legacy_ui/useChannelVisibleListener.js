"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChannelVisibleListener = void 0;
var react_1 = require("react");
var useChannelVisibleListener = function (setChannels, customHandler) {
    (0, react_1.useEffect)(function () {
        // TODO: wire up real Stream Chat client events
    }, [setChannels, customHandler]);
};
exports.useChannelVisibleListener = useChannelVisibleListener;
