"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIsChannelMuted = void 0;
var react_1 = require("react");
/**
 * Minimal replacement for Stream Chat React's `useIsChannelMuted` hook.
 * Tracks whether the given channel is muted and updates on
 * `notification.channel_mutes_updated` events.
 */
var useIsChannelMuted = function (channel) {
    // attempt to access the client from the channel object
    var client = channel.client;
    var _a = (0, react_1.useState)(function () { return channel.muteStatus(); }), muted = _a[0], setMuted = _a[1];
    (0, react_1.useEffect)(function () {
        if (!(client === null || client === void 0 ? void 0 : client.on))
            return;
        var handleEvent = function () { return setMuted(channel.muteStatus()); };
        client.on('notification.channel_mutes_updated', handleEvent);
        return function () { var _a; return (_a = client.off) === null || _a === void 0 ? void 0 : _a.call(client, 'notification.channel_mutes_updated', handleEvent); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [muted]);
    return muted;
};
exports.useIsChannelMuted = useIsChannelMuted;
