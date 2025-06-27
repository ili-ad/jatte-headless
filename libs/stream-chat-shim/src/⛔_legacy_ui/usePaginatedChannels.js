"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePaginatedChannels = void 0;
var react_1 = require("react");
/**
 * Placeholder implementation of usePaginatedChannels.
 * Returns a structure compatible with Stream's hook but with no real behaviour.
 */
var usePaginatedChannels = function (_client, _filters, _sort, _options, _activeChannelHandler, _recoveryThrottleIntervalMs, _customQueryChannels) {
    if (_recoveryThrottleIntervalMs === void 0) { _recoveryThrottleIntervalMs = 5000; }
    var _a = (0, react_1.useState)([]), channels = _a[0], setChannels = _a[1];
    var _b = (0, react_1.useState)(true), hasNextPage = _b[0], setHasNextPage = _b[1];
    (0, react_1.useEffect)(function () {
        // TODO: wire up Stream Chat client events
    }, []);
    var loadNextPage = function () {
        throw new Error('usePaginatedChannels not implemented');
    };
    return { channels: channels, hasNextPage: hasNextPage, loadNextPage: loadNextPage, setChannels: setChannels };
};
exports.usePaginatedChannels = usePaginatedChannels;
