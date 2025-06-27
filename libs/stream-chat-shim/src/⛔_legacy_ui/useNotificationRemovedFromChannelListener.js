"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNotificationRemovedFromChannelListener = void 0;
var react_1 = require("react");
var useNotificationRemovedFromChannelListener = function (setChannels, customHandler) {
    (0, react_1.useEffect)(function () {
        // TODO: wire up real Stream Chat client events
    }, [setChannels, customHandler]);
};
exports.useNotificationRemovedFromChannelListener = useNotificationRemovedFromChannelListener;
