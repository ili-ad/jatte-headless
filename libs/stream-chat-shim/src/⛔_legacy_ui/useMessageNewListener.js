"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMessageNewListener = void 0;
var react_1 = require("react");
/**
 * Placeholder for Stream\'s useMessageNewListener hook.
 * Sets up a listener for new message events.
 */
var useMessageNewListener = function (setChannels, customHandler, lockChannelOrder, allowNewMessagesFromUnfilteredChannels) {
    if (lockChannelOrder === void 0) { lockChannelOrder = false; }
    if (allowNewMessagesFromUnfilteredChannels === void 0) { allowNewMessagesFromUnfilteredChannels = true; }
    (0, react_1.useEffect)(function () {
        // TODO: wire up real Stream Chat client events
    }, [
        setChannels,
        customHandler,
        lockChannelOrder,
        allowNewMessagesFromUnfilteredChannels,
    ]);
};
exports.useMessageNewListener = useMessageNewListener;
