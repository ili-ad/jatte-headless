"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUserPresenceChangedListener = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation for useUserPresenceChangedListener.
 * TODO: connect to Stream Chat client when available.
 *
 * @param setChannels - state setter for channels list
 * @param customHandler - optional custom event handler
 */
var useUserPresenceChangedListener = function (setChannels, customHandler) {
    (0, react_1.useEffect)(function () {
        // TODO: wire up real Stream Chat client events
    }, [setChannels, customHandler]);
};
exports.useUserPresenceChangedListener = useUserPresenceChangedListener;
